import mongoose, { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function normalizeIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter((value): value is string => typeof value === 'string' && isValidObjectId(value));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const body = (input ?? {}) as Record<string, unknown>;
  const userId = typeof body.userId === 'string' ? body.userId : undefined;
  const teamId = typeof body.teamId === 'string' ? body.teamId : undefined;
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const minutes = Number(body.minutes);

  if (!userId || !teamId || !type || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'Activity requires userId, teamId, type, and minutes.');
  }

  if (!isValidObjectId(userId) || !isValidObjectId(teamId)) {
    throw httpError(400, 'Activity references must be valid ObjectIds.');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw httpError(404, 'Activity references must match an existing user and team.');
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const body = (input ?? {}) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : '';
  const memberIds = normalizeIdList(body.members);

  if (!name) {
    throw httpError(400, 'Team name is required.');
  }

  if (!mascot) {
    throw httpError(400, 'Team mascot is required.');
  }

  if (body.members !== undefined && !Array.isArray(body.members)) {
    throw httpError(400, 'Team members must be an array of ObjectIds.');
  }

  const invalidMemberId = Array.isArray(body.members)
    ? body.members.find((value) => typeof value !== 'string' || !isValidObjectId(value))
    : undefined;
  if (invalidMemberId !== undefined) {
    throw httpError(400, 'Team members must be valid ObjectIds.');
  }

  const team = await Team.create({ name, mascot, members: memberIds });

  if (memberIds.length > 0) {
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }

  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  if (totals.length === 0) {
    return [];
  }

  const teamIds = totals.map((entry) => new mongoose.Types.ObjectId(entry._id));
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamsById = new Map(teams.map((team) => [team._id.toString(), team]));

  return totals.map((entry, index) => ({
    teamName: teamsById.get(String(entry._id))?.name ?? 'Unknown team',
    totalPoints: Number(entry.totalPoints ?? 0),
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = decodeURIComponent(userEmail ?? '').trim();

  const user = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i') } }).lean();
  if (!user) {
    throw httpError(404, 'No matching user was found for that email address.');
  }

  const recentActivity = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(1).lean();
  const activityType = recentActivity[0]?.type?.toString() ?? '';
  const preferredFocus = (user.fitnessGoal ?? '').toString().trim() || (activityType || 'endurance');
  const focusPattern = new RegExp(`^${escapeRegExp(preferredFocus)}$`, 'i');

  const matching = await Workout.find({ focus: focusPattern }).lean();
  const candidates = matching.length > 0 ? matching : await Workout.find().lean();
  const reason = `Matches your ${preferredFocus} goal and recent ${activityType || 'activity'} pattern.`;

  return candidates.map((workout) => ({
    ...workout,
    focus: workout.focus,
    reason,
  }));
}

export { User };
