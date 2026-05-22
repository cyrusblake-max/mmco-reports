import { WeeklyReport } from './types'

export const MOCK_REPORT: WeeklyReport = {
  id: 'mock-report-001',
  weekNumber: 4,
  reportDate: '2026-05-18',
  weekStartDate: '2026-05-12',
  weekEndDate: '2026-05-18',

  property: {
    address: '432 Park Avenue',
    unit: 'Unit 87B',
    neighborhood: 'Midtown East',
    city: 'New York',
    state: 'NY',
    zip: '10022',
    price: 7_500_000,
    beds: 3,
    baths: 3.5,
    sqft: 2_847,
    listingDate: '2026-04-21',
    mainImageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=90',
    galleryImages: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80',
    ],
    description:
      'A rare offering at one of Manhattan\'s most iconic addresses — 432 Park Avenue. Residence 87B presents sweeping 270° panoramic views of Central Park, the Hudson River, and the shimmering Midtown skyline from every principal room. Featuring custom Italian millwork, Calacatta marble throughout, and a Gaggenau kitchen of extraordinary caliber. Three bedrooms, three and a half baths. White-glove full-service building with private dining, fitness center, and 24-hour concierge.',
    agent: {
      name: '',
      title: 'Licensed Associate Real Estate Broker',
      team: 'MM&co',
      brokerage: 'Compass',
      phone: '',
      email: '',
      photoUrl: '',
      logoUrl: '/mmco-logo.png',
    },
  },

  currentMetrics: {
    totalViews:         3_847,
    websiteTraffic:       812,
    zillowViews:        1_204,
    streetEasyViews:    1_109,
    compassViews:         722,
    saves:                 94,
    inquiries:             18,
    showingRequests:        9,
    openHouseAttendees:    34,
    brokerInquiries:       22,
    buyerLeads:            11,
    socialReach:        28_400,
    videoViews:          6_210,
  },

  previousMetrics: {
    totalViews:         3_102,
    websiteTraffic:       644,
    zillowViews:          981,
    streetEasyViews:      892,
    compassViews:         584,
    saves:                 71,
    inquiries:             13,
    showingRequests:        6,
    openHouseAttendees:    27,
    brokerInquiries:       16,
    buyerLeads:             8,
    socialReach:        19_800,
    videoViews:          4_340,
  },

  metricsHistory: [
    {
      weekLabel: 'Week 1',
      weekNumber: 1,
      metrics: {
        totalViews:         1_840,
        websiteTraffic:       320,
        zillowViews:          610,
        streetEasyViews:      580,
        compassViews:         330,
        saves:                 38,
        inquiries:              7,
        showingRequests:        3,
        openHouseAttendees:     0,
        brokerInquiries:        9,
        buyerLeads:             4,
        socialReach:         9_100,
        videoViews:          1_820,
      },
    },
    {
      weekLabel: 'Week 2',
      weekNumber: 2,
      metrics: {
        totalViews:         2_610,
        websiteTraffic:       512,
        zillowViews:          844,
        streetEasyViews:      780,
        compassViews:         474,
        saves:                 55,
        inquiries:             10,
        showingRequests:        5,
        openHouseAttendees:    21,
        brokerInquiries:       13,
        buyerLeads:             6,
        socialReach:        14_200,
        videoViews:          3_100,
      },
    },
    {
      weekLabel: 'Week 3',
      weekNumber: 3,
      metrics: {
        totalViews:         3_102,
        websiteTraffic:       644,
        zillowViews:          981,
        streetEasyViews:      892,
        compassViews:         584,
        saves:                 71,
        inquiries:             13,
        showingRequests:        6,
        openHouseAttendees:    27,
        brokerInquiries:       16,
        buyerLeads:             8,
        socialReach:        19_800,
        videoViews:          4_340,
      },
    },
    {
      weekLabel: 'Week 4',
      weekNumber: 4,
      metrics: {
        totalViews:         3_847,
        websiteTraffic:       812,
        zillowViews:        1_204,
        streetEasyViews:    1_109,
        compassViews:         722,
        saves:                 94,
        inquiries:             18,
        showingRequests:        9,
        openHouseAttendees:    34,
        brokerInquiries:       22,
        buyerLeads:            11,
        socialReach:        28_400,
        videoViews:          6_210,
      },
    },
  ],

  openHouses: [
    {
      id: 'oh-001',
      date: '2026-05-17',
      startTime: '12:00',
      endTime: '14:00',
      totalAttendees: 22,
      brokers: 8,
      buyers: 14,
      seriousInterestLevel: 4,
      commonFeedback:
        'Universally praised views and kitchen quality. Minor concerns about the primary closet size. Several buyers comparing to available units at 220 CPS and 111 W57.',
      questionsAsked:
        'Storage availability? Building pet policy? Monthly common charges and taxes? Availability of parking? Timing flexibility on close?',
      followUpActions:
        'Sent floor plan with storage locker details to 4 inquiries. Scheduled private showings for 2 interested buyers. Followed up with 3 brokers re: client situations.',
    },
    {
      id: 'oh-002',
      date: '2026-05-14',
      startTime: '17:00',
      endTime: '19:00',
      totalAttendees: 12,
      brokers: 9,
      buyers: 3,
      seriousInterestLevel: 3,
      commonFeedback:
        'Broker preview event. Strong broker interest. Feedback consistent — pricing feels slightly above current market comps. Views universally impressive.',
      questionsAsked:
        'Any flexibility on price? Any offers received? What\'s the seller\'s motivation and timeline?',
      followUpActions:
        'Sent comp analysis to 5 broker inquiries. Circulated listing to broker network of 200+ agents.',
    },
  ],

  marketing: [
    {
      id: 'mkt-001',
      type: 'instagram_reel',
      name: 'Sunrise View Cinematic Reel',
      date: '2026-05-13',
      impressions: 84_200,
      engagement: 4_810,
      clicks: 1_204,
      reach: 71_400,
      screenshotUrl: '',
      notes: '60-second sunrise drone reel. Best performing content this cycle.',
    },
    {
      id: 'mkt-002',
      type: 'email_campaign',
      name: 'Broker Network Blast — Week 4',
      date: '2026-05-12',
      impressions: 4_200,
      engagement: 884,
      clicks: 312,
      reach: 4_200,
      notes: 'Sent to 4,200 NYC broker contacts via Mailchimp. 21% open rate.',
    },
    {
      id: 'mkt-003',
      type: 'zillow_boost',
      name: 'Zillow Premier Agent Boost',
      date: '2026-05-12',
      impressions: 18_400,
      engagement: 1_204,
      clicks: 842,
      reach: 18_400,
      notes: '$1,200 weekly Zillow boost. Top of search results for Midtown East.',
    },
    {
      id: 'mkt-004',
      type: 'instagram_post',
      name: 'Kitchen Detail Photography',
      date: '2026-05-15',
      impressions: 22_100,
      engagement: 1_840,
      clicks: 408,
      reach: 18_900,
      notes: 'Carousel of 8 kitchen detail shots. Strong save rate (4.2%).',
    },
    {
      id: 'mkt-005',
      type: 'broker_outreach',
      name: 'Private Broker Preview Event',
      date: '2026-05-14',
      reach: 200,
      notes: 'In-person broker preview at the property. 12 attendees.',
    },
    {
      id: 'mkt-006',
      type: 'facebook_ad',
      name: 'Facebook Paid Campaign',
      date: '2026-05-08',
      clicks: 174,
      notes: 'Facebook digital ad. 4.39% CTR. May 8–21, 2026.',
    },
    {
      id: 'mkt-007',
      type: 'instagram_post',
      name: 'Instagram Paid Campaign',
      date: '2026-05-08',
      clicks: 368,
      notes: 'Instagram digital ad. 7.56% CTR — top performing channel. May 8–21, 2026.',
    },
    {
      id: 'mkt-008',
      type: 'google_ad',
      name: 'Google Display Ad',
      date: '2026-05-08',
      clicks: 301,
      notes: 'Google digital ad. 2.55% CTR. Total impressions across all digital channels: 20,611. May 8–21, 2026.',
    },
  ],

  socialMedia: [
    {
      platform: 'instagram',
      reelViews: 84_200,
      likes: 3_841,
      comments: 214,
      shares: 488,
      saves: 1_204,
      engagementRate: 6.8,
      followerGrowth: 142,
      trafficShare: 59.7,
      bestContentDescription: 'Sunrise cinematic reel — 432 Park Ave panoramic view',
      bestContentViews: 84_200,
    },
    {
      platform: 'facebook',
      reelViews: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      engagementRate: 0,
      followerGrowth: 0,
      trafficShare: 30.5,
    },
    {
      platform: 'youtube',
      reelViews: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      engagementRate: 0,
      followerGrowth: 0,
      trafficShare: 9.8,
    },
  ],

  feedback: {
    items: [
      { id: 'f1', sentiment: 'positive', comment: 'The views from the living room are absolutely extraordinary. Nothing like it on the market right now.', source: 'buyer' },
      { id: 'f2', sentiment: 'positive', comment: 'Kitchen quality is exceptional — Gaggenau appliances, Calacatta marble. My clients were very impressed.', source: 'broker' },
      { id: 'f3', sentiment: 'negative', comment: 'Primary bedroom closet is smaller than expected for this price point. That may be a dealbreaker for one of my clients.', source: 'broker' },
      { id: 'f4', sentiment: 'neutral', comment: 'They\'re comparing it closely to a unit at 220 CPS that\'s priced $400K lower. How does the seller feel about flexibility?', source: 'buyer' },
      { id: 'f5', sentiment: 'positive', comment: 'The building service and amenities are top tier. Private dining room is a great selling point.', source: 'buyer' },
      { id: 'f6', sentiment: 'negative', comment: 'Monthly carrying costs feel high when factoring common charges + taxes. Buyers are sensitive to that right now.', source: 'broker' },
    ],
    commonObjections:
      'Carrying costs (common charges + RE taxes), primary closet size, comparison to competing unit at 220 CPS priced $400K lower.',
    pricingFeedback:
      'Majority of broker feedback suggests the $7.5M ask is 3–5% above where the market is landing on comparable high-floor condos. 220 CPS comparison is the most frequent reference point.',
    layoutFeedback:
      'Floor plan is well-received overall. Primary suite is praised for bathroom quality. Closet size is the single most recurring layout concern — affects roughly 30% of prospects who raise objections.',
    competingProperties:
      '220 Central Park South Unit 62A ($7.1M, 2,900 SF), 111 West 57th Street Unit 54 ($8.2M, 3,100 SF), 53W53 Unit 44 ($6.8M, 2,600 SF).',
    brokerSentiment:
      'Broker community is actively engaged — especially following the broker preview event. Sentiment is positive on the property\'s unique view and quality. Price sensitivity is the main hesitation. Several brokers have qualified buyers in the $7–7.2M range.',
    recommendedAdjustments:
      'Consider price positioning conversation with seller. Explore if seller would entertain a $7.25M counteroffer scenario. Highlight storage locker (200 SF) in all marketing materials to address closet concern.',
  },

  marketActivity: {
    newListings: [
      { id: 'c1', address: '220 Central Park South, Unit 62A', price: 7_100_000, beds: 3, baths: 3, sqft: 2_900, status: 'active', daysOnMarket: 12 },
      { id: 'c2', address: '53W53, Unit 44', price: 6_800_000, beds: 2, baths: 2.5, sqft: 2_600, status: 'active', daysOnMarket: 5 },
    ],
    priceReductions: [
      { id: 'c3', address: '15 Hudson Yards, Unit 73A', price: 8_400_000, priceChange: -400_000, beds: 3, baths: 3.5, sqft: 3_100, status: 'reduced', daysOnMarket: 94 },
      { id: 'c4', address: '35 Hudson Yards, Unit 68B', price: 6_200_000, priceChange: -200_000, beds: 2, baths: 2, sqft: 2_200, status: 'reduced', daysOnMarket: 71 },
    ],
    underContract: [
      { id: 'c5', address: '111 W 57th St, Unit 44', price: 8_200_000, beds: 3, baths: 3, sqft: 3_100, status: 'contract', daysOnMarket: 38 },
      { id: 'c6', address: '520 Park Ave, Unit 32A', price: 5_900_000, beds: 2, baths: 2, sqft: 1_980, status: 'contract', daysOnMarket: 21 },
    ],
    recentSales: [
      { id: 'c7', address: '432 Park Ave, Unit 72B', price: 7_100_000, beds: 3, baths: 3, sqft: 2_840, status: 'sold', daysOnMarket: 55 },
      { id: 'c8', address: '220 CPS, Unit 58C', price: 6_800_000, beds: 2, baths: 2.5, sqft: 2_500, status: 'sold', daysOnMarket: 42 },
    ],
    neighborhoodTrends:
      'Midtown East luxury condo market remains competitive. Average days-on-market for $5M+ units is 61 days, up from 48 days in Q1. Absorption rate has slowed modestly as inventory increases. Price-per-square-foot for comparable buildings averaging $2,490–$2,780 PSF. Buyer pool remains active from domestic HNW and international buyers.',
  },

  strategy: {
    keyRecommendations:
      '1. Initiate pricing conversation with seller — broker feedback consistently points to 3-5% above market. A $7.25M positioning may accelerate interest and competitive offer scenarios.\n2. Leverage the strong social performance from the sunrise reel with a follow-up cinematic campaign focused on evening/sunset views.\n3. Schedule a second broker preview event for the following week targeting brokers who have buyers in the $7–7.5M range.\n4. Add custom storage locker detail to all marketing materials to address closet objection proactively.',
    marketingPlanNextWeek:
      '— Produce evening/sunset cinematic video (drone + interior)\n— Launch targeted Instagram campaign for penthouse-level buyer demographic\n— Send personalized follow-up to top 5 broker inquiries with updated comp analysis\n— Place property in next NY Times Real Estate digital feature\n— Activate StreetEasy Premium Placement for added visibility',
    pricingStrategy:
      'Current ask of $7,500,000 is approximately 4% above current comparable closed sales. Recommend discussing with seller a strategic price adjustment to $7,250,000 or offering seller concessions (closing cost credits) to close the gap for motivated buyers. This adjustment would position the property favorably against the 220 CPS comp.',
    upcomingCampaigns:
      '— Evening cinematic video launch (week of May 25)\n— NY Times digital placement (May 22 edition)\n— Compass Private Exclusives newsletter feature\n— Hamptons buyer outreach campaign (targeting second-home buyers)',
    brokerEvents:
      '— Broker preview cocktail event — May 22 at 5:30PM\n— REBNY weekly meeting presentation — May 20\n— Compass luxury division tour — May 23',
    openHousesPlanned:
      '— Public open house: Sunday May 24, 12–2PM\n— Broker open: Wednesday May 21, 11AM–1PM\n— Private showing availability: daily by appointment',
  },
}
