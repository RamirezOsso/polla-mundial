export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'cancelled'
export type StageType = 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
export type NotificationType = 'match_starting' | 'result_published' | 'points_updated' | 'league_invite' | 'achievement'
export type LeagueRole = 'admin' | 'member'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  country: string | null
  favorite_team: string | null
  is_admin: boolean
  total_points: number
  total_exact_scores: number
  total_correct_results: number
  total_predictions: number
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  short_name: string
  flag_url: string | null
  group_name: string | null
  confederation: string | null
  is_active: boolean
}

export interface Stage {
  id: string
  name: string
  type: StageType
  order_num: number
  is_active: boolean
}

export interface Match {
  id: string
  stage_id: string
  home_team_id: string
  away_team_id: string
  match_date: string
  venue: string | null
  city: string | null
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  group_name: string | null
  match_number: number | null
  is_locked: boolean
  locked_at: string | null
  result_published_at: string | null
  created_at: string
  updated_at: string
  home_team?: Team
  away_team?: Team
  stage?: Stage
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  home_score: number
  away_score: number
  points_earned: number
  is_calculated: boolean
  created_at: string
  updated_at: string
  match?: Match
  profile?: Profile
}

export interface League {
  id: string
  name: string
  description: string | null
  invite_code: string
  owner_id: string
  max_members: number
  is_public: boolean
  is_active: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
  owner?: Profile
  member_count?: number
}

export interface LeagueMember {
  id: string
  league_id: string
  user_id: string
  role: LeagueRole
  total_points: number
  rank: number | null
  joined_at: string
  profile?: Profile
  league?: League
}

export interface GlobalRanking {
  id: string
  user_id: string
  total_points: number
  exact_scores: number
  correct_results: number
  total_predictions: number
  champion_correct: boolean
  finalists_correct: number
  rank: number | null
  previous_rank: number | null
  updated_at: string
  profile?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  data: Record<string, unknown> | null
  created_at: string
}

export interface Achievement {
  id: string
  name: string
  description: string | null
  icon: string | null
  condition_type: string
  condition_value: number
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  achievement?: Achievement
}
