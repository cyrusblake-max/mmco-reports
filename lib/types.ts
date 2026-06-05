export interface Agent {
  name: string
  title: string
  team: string
  brokerage: string
  phone: string
  email: string
  photoUrl?: string
  logoUrl?: string
}

export interface Property {
  address: string
  unit?: string
  neighborhood: string
  city: string
  state: string
  zip: string
  price: number
  beds: number
  baths: number
  sqft: number
  listingDate: string
  mainImageUrl?: string
  galleryImages?: string[]
  description?: string
  agent: Agent
  coAgents?: Agent[]
}

export interface WeeklyMetrics {
  totalViews: number
  websiteTraffic: number
  zillowViews: number
  streetEasyViews: number
  compassViews: number
  saves: number
  inquiries: number
  showingRequests: number
  openHouseAttendees: number
  brokerInquiries: number
  buyerLeads: number
  socialReach: number
  videoViews: number
}

export const METRIC_LABELS: Record<keyof WeeklyMetrics, string> = {
  totalViews:         'Total Views',
  websiteTraffic:     'Website Traffic',
  zillowViews:        'Zillow Views',
  streetEasyViews:    'StreetEasy Views',
  compassViews:       'Compass Views',
  saves:              'Saves / Favorites',
  inquiries:          'Inquiries',
  showingRequests:    'Showing Requests',
  openHouseAttendees: 'Open House Attendees',
  brokerInquiries:    'Broker Inquiries',
  buyerLeads:         'Buyer Leads',
  socialReach:        'Social Media Reach',
  videoViews:         'Video Views',
}

export interface MetricsSnapshot {
  weekLabel: string
  weekNumber: number
  metrics: WeeklyMetrics
}

export interface OpenHouseEvent {
  id: string
  date: string
  startTime: string
  endTime: string
  totalAttendees: number
  brokers: number
  buyers: number
  seriousInterestLevel: 1 | 2 | 3 | 4 | 5
  commonFeedback: string
  questionsAsked: string
  followUpActions: string
}

export type MarketingType =
  | 'instagram_post'
  | 'instagram_reel'
  | 'tiktok'
  | 'email_campaign'
  | 'broker_outreach'
  | 'private_exclusive'
  | 'facebook_ad'
  | 'google_ad'
  | 'zillow_boost'
  | 'print'
  | 'open_house_campaign'
  | 'video_campaign'
  | 'other'

export const MARKETING_LABELS: Record<MarketingType, string> = {
  instagram_post:      'Instagram Post',
  instagram_reel:      'Instagram Reel',
  tiktok:              'TikTok',
  email_campaign:      'Email Campaign',
  broker_outreach:     'Broker Outreach',
  private_exclusive:   'Private Exclusive',
  facebook_ad:         'Facebook Ad',
  google_ad:           'Google Ad',
  zillow_boost:        'Zillow Boost',
  print:               'Print Materials',
  open_house_campaign: 'Open House Campaign',
  video_campaign:      'Video Campaign',
  other:               'Other',
}

export interface MarketingActivity {
  id: string
  type: MarketingType
  name: string
  date: string
  impressions?: number
  engagement?: number
  clicks?: number
  reach?: number
  link?: string
  screenshotUrl?: string
  notes?: string
}

export interface SocialPlatformStats {
  platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube'
  reelViews: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagementRate: number
  followerGrowth: number
  trafficShare?: number
  bestContentDescription?: string
  bestContentViews?: number
  bestContentThumbnail?: string
}

export interface FeedbackItem {
  id: string
  sentiment: 'positive' | 'negative' | 'neutral'
  comment: string
  source: 'buyer' | 'broker'
}

export interface FeedbackSection {
  items: FeedbackItem[]
  commonObjections: string
  pricingFeedback: string
  layoutFeedback: string
  competingProperties: string
  brokerSentiment: string
  recommendedAdjustments: string
}

export interface ComparableListing {
  id: string
  address: string
  price: number
  priceChange?: number
  beds: number
  baths: number
  sqft: number
  status: 'active' | 'contract' | 'sold' | 'reduced'
  daysOnMarket?: number
}

export interface MarketActivitySection {
  newListings: ComparableListing[]
  priceReductions: ComparableListing[]
  underContract: ComparableListing[]
  recentSales: ComparableListing[]
  neighborhoodTrends: string
}

export interface AgentStrategySection {
  keyRecommendations: string
  marketingPlanNextWeek: string
  pricingStrategy: string
  upcomingCampaigns: string
  brokerEvents: string
  openHousesPlanned: string
}

export interface AdChannelStat {
  channel: string
  clicks: number
  ctr: number
}

export interface SocialTrafficShare {
  channel: string
  share: number
}

export interface PublisherViews {
  publisher: string
  views: number
}

export interface AudienceBracket {
  bracket: string
  share: number
}

export interface DigitalAdsSection {
  reportingPeriod: string
  totalImpressions: number
  totalClicks: number
  topChannel?: { name: string; ctr: number }
  byChannel: AdChannelStat[]
  socialTrafficPeriod: string
  socialTrafficShare: SocialTrafficShare[]
  // Optional — for display / location-based campaigns
  campaignName?: string
  targetingFocus?: string
  cpc?: number
  topPublishers?: PublisherViews[]
  audienceHouseholdIncome?: AudienceBracket[]
}

export interface WeeklyReport {
  id: string
  weekNumber: number
  reportDate: string
  weekStartDate: string
  weekEndDate: string
  property: Property
  currentMetrics: WeeklyMetrics
  previousMetrics?: WeeklyMetrics
  metricsHistory: MetricsSnapshot[]
  openHouses: OpenHouseEvent[]
  marketing: MarketingActivity[]
  socialMedia: SocialPlatformStats[]
  digitalAds?: DigitalAdsSection
  feedback: FeedbackSection
  marketActivity: MarketActivitySection
  strategy: AgentStrategySection
  includedSections?: IncludedSections
}

export interface IncludedSections {
  propertyOverview: boolean
  weeklySnapshot:   boolean
  openHouses:       boolean
  marketing:        boolean
  socialMedia:      boolean
  feedback:         boolean
  marketActivity:   boolean
  strategy:         boolean
}

export const DEFAULT_INCLUDED_SECTIONS: IncludedSections = {
  propertyOverview: true,
  weeklySnapshot:   true,
  openHouses:       true,
  marketing:        true,
  socialMedia:      true,
  feedback:         true,
  marketActivity:   true,
  strategy:         true,
}

export const SECTION_DISPLAY: { key: keyof IncludedSections; num: string; label: string }[] = [
  { key: 'propertyOverview', num: '01', label: 'Property Overview' },
  { key: 'weeklySnapshot',   num: '02', label: 'Weekly Performance Snapshot' },
  { key: 'openHouses',       num: '03', label: 'Open Houses' },
  { key: 'marketing',        num: '04', label: 'Marketing Activities' },
  { key: 'socialMedia',      num: '05', label: 'Social Media' },
  { key: 'feedback',         num: '06', label: 'Buyer & Broker Feedback' },
  { key: 'marketActivity',   num: '07', label: 'Market Activity' },
  { key: 'strategy',         num: '08', label: 'Agent Strategy & Next Steps' },
]
