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

export type OpenHouseKind =
  | 'public'           // Public open house (default — split into broker/buyer)
  | 'broker'           // Broker-only event (no buyer column)
  | 'private_preview'  // Private preview (single attendee tile, no split)
  | 'private_showing'  // Private showing — same shape as preview
  | 'custom'           // Custom labeled event

export const OPEN_HOUSE_KIND_LABELS: Record<OpenHouseKind, string> = {
  public:          'Public Open House',
  broker:          'Broker Open House',
  private_preview: 'Private Preview',
  private_showing: 'Private Showing',
  custom:          'Custom Event',
}

/**
 * Field keys that can be hidden per-event. The editor surfaces these as
 * "show/hide" toggles so an agent can strip out fields that don't apply
 * (e.g. drop interest level + questions for a quick private preview row).
 */
export type OpenHouseField =
  | 'attendeeBreakdown'  // brokers/buyers split (otherwise just totalAttendees)
  | 'interestLevel'
  | 'commonFeedback'
  | 'questionsAsked'
  | 'followUpActions'

export const OPEN_HOUSE_FIELD_LABELS: Record<OpenHouseField, string> = {
  attendeeBreakdown: 'Broker / Buyer split',
  interestLevel:     'Interest level',
  commonFeedback:    'Common feedback',
  questionsAsked:    'Questions asked',
  followUpActions:   'Follow-up actions',
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
  /** What kind of event — drives the header label. Defaults to 'public'. */
  kind?: OpenHouseKind
  /** Custom override for the header label when `kind === 'custom'`. */
  customLabel?: string
  /** Field keys to hide from rendering. Empty/missing = show all that apply. */
  hiddenFields?: OpenHouseField[]
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

export interface CustomSection {
  id: string
  title: string
  /** Free-form markdown-lite — newlines become paragraphs, lines prefixed
   *  with `- ` or `• ` render as bullets. */
  body: string
  /** Optional eyebrow line shown above the title (e.g. "AGENT INSIGHT") */
  eyebrow?: string
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
  /** User-added free-form sections, rendered after the built-ins. */
  customSections?: CustomSection[]
  /**
   * Display order for sections. Each entry is either a built-in `SectionKey`
   * or `custom:<id>`. Unknown keys are skipped. When omitted, the default
   * order from `DEFAULT_SECTION_ORDER` is used.
   */
  sectionOrder?: string[]
}

export interface IncludedSections {
  propertyOverview: boolean
  weeklySnapshot:   boolean
  openHouses:       boolean
  marketing:        boolean
  socialMedia:      boolean
  digitalAds:       boolean
  feedback:         boolean
  marketActivity:   boolean
  strategy:         boolean
}

export type SectionKey = keyof IncludedSections

export const DEFAULT_INCLUDED_SECTIONS: IncludedSections = {
  propertyOverview: true,
  weeklySnapshot:   true,
  openHouses:       true,
  marketing:        true,
  socialMedia:      true,
  digitalAds:       true,
  feedback:         true,
  marketActivity:   true,
  strategy:         true,
}

export const SECTION_DISPLAY: { key: SectionKey; label: string }[] = [
  { key: 'propertyOverview', label: 'Property Overview' },
  { key: 'weeklySnapshot',   label: 'Weekly Performance Snapshot' },
  { key: 'openHouses',       label: 'Open Houses & Showings' },
  { key: 'marketing',        label: 'Marketing Activities' },
  { key: 'socialMedia',      label: 'Social Media' },
  { key: 'digitalAds',       label: 'Digital Ads & Reach' },
  { key: 'feedback',         label: 'Buyer & Broker Feedback' },
  { key: 'marketActivity',   label: 'Market Activity' },
  { key: 'strategy',         label: 'Agent Strategy & Next Steps' },
]

export const DEFAULT_SECTION_ORDER: SectionKey[] = SECTION_DISPLAY.map(s => s.key)
