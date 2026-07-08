import { WeeklyReport } from './types'

/**
 * 266 West 71st Street — second active MM&Co listing.
 * Fill in the property fields (price, beds, baths, sqft, listing date,
 * photo URL, description) in the editor or update this file directly.
 */
export const WEST71_REPORT: WeeklyReport = {
  id: 'west71-266-w1',
  weekNumber: 3,
  reportDate: '2026-07-08',
  // Reporting window: last week (June 29 – July 5, 2026) — spans the July 4th holiday.
  weekStartDate: '2026-06-29',
  weekEndDate: '2026-07-05',

  property: {
    address: '266 West 71st Street',
    unit: '',
    neighborhood: 'Upper West Side',
    city: 'New York',
    state: 'NY',
    zip: '10023',
    price: 4_995_000,
    beds: 4,
    baths: 5,
    sqft: 3520,
    listingDate: '2026-06-02',
    mainImageUrl: '/west71-hero.jpg',
    galleryImages: [],
    description:
      'A rare opportunity to restore and reimagine a historic Upper West Side townhouse on one of the neighborhood\u2019s most beautiful tree-lined blocks. Built in 1899 and rich with original architectural details — six fireplaces, intricate moldings, decorative paneling, and an elegant stoop entry. 3,520 square feet of light-filled space across four bedrooms and five bathrooms, offering extraordinary potential.',
    agent: {
      name: 'Maggie L. Marshall',
      title: 'Licensed Associate Real Estate Broker',
      team: 'MM&Co.',
      brokerage: 'Compass',
      phone: '917-838-4774',
      email: 'mlm@compass.com',
      photoUrl: '/613-baltic-agent.jpg',
      logoUrl: '/mmco-logo.png',
    },
    coAgents: [
      {
        name: 'Jonathan Banks',
        title: 'Licensed Real Estate Salesperson',
        team: '',                       // Not on MM&Co. — just Compass
        brokerage: 'Compass',
        phone: '917-657-2252',
        email: '',
        photoUrl: '/jonathan-banks.jpg',
        logoUrl: '',
      },
    ],
  },

  // Week 3 (June 29 – July 5) — spans July 4th holiday.
  // Compass Insights: 729 total views (199 Compass / 335 Realtor / 195 StreetEasy),
  // 162 unique visitors (up 52.8%), 44s avg time spent (up 106%).
  // 91% of Compass views from public. Compass is the top traffic source (68%).
  // Showings + open house numbers pending — user will send shortly.
  currentMetrics: {
    totalViews: 729,
    websiteTraffic: 0,
    zillowViews: 0,
    streetEasyViews: 195,
    compassViews: 199,
    saves: 0,
    inquiries: 0,
    showingRequests: 0,
    openHouseAttendees: 0,
    brokerInquiries: 0,
    buyerLeads: 0,
    socialReach: 0,
    videoViews: 0,
  },

  // Previous = Week 2 (Jun 15 – 21) for week-over-week trend math.
  previousMetrics: {
    totalViews: 770,
    websiteTraffic: 0,
    zillowViews: 0,
    streetEasyViews: 264,
    compassViews: 89,
    saves: 0,
    inquiries: 0,
    showingRequests: 3,
    openHouseAttendees: 4,
    brokerInquiries: 0,
    buyerLeads: 0,
    socialReach: 0,
    videoViews: 0,
  },

  metricsHistory: [
    {
      weekLabel: 'Week 1',
      weekNumber: 1,
      metrics: {
        totalViews: 831,
        websiteTraffic: 0,
        zillowViews: 0,
        streetEasyViews: 453,
        compassViews: 96,
        saves: 0,
        inquiries: 0,
        showingRequests: 5,
        openHouseAttendees: 0,
        brokerInquiries: 0,
        buyerLeads: 0,
        socialReach: 0,
        videoViews: 0,
      },
    },
    {
      weekLabel: 'Week 2',
      weekNumber: 2,
      metrics: {
        totalViews: 770,
        websiteTraffic: 0,
        zillowViews: 0,
        streetEasyViews: 264,
        compassViews: 89,
        saves: 0,
        inquiries: 0,
        showingRequests: 3,
        openHouseAttendees: 4,
        brokerInquiries: 0,
        buyerLeads: 0,
        socialReach: 0,
        videoViews: 0,
      },
    },
    {
      weekLabel: 'Week 3',
      weekNumber: 3,
      metrics: {
        totalViews: 729,
        websiteTraffic: 0,
        zillowViews: 0,
        streetEasyViews: 195,
        compassViews: 199,
        saves: 0,
        inquiries: 0,
        showingRequests: 0,
        openHouseAttendees: 0,
        brokerInquiries: 0,
        buyerLeads: 0,
        socialReach: 0,
        videoViews: 0,
      },
    },
  ],

  includedSections: {
    propertyOverview: false,
    weeklySnapshot:   true,
    openHouses:       true,
    marketing:        false,
    socialMedia:      false,
    digitalAds:       true,
    feedback:         true,
    marketActivity:   false,
    strategy:         true,
  },

  openHouses: [
    {
      id: 'oh-west71-preview',
      date: '2026-06-03',
      startTime: '14:00',
      endTime: '14:45',
      totalAttendees: 1,
      brokers: 0,
      buyers: 1,
      seriousInterestLevel: 3,
      commonFeedback: '',
      questionsAsked: '',
      followUpActions: 'Private preview — one prospective buyer previewed the home.',
    },
    {
      id: 'oh-west71-w2-sun',
      kind: 'public',
      date: '2026-06-21',
      startTime: '13:00',
      endTime: '14:30',
      totalAttendees: 4,
      brokers: 0,
      buyers: 4,
      seriousInterestLevel: 3,
      commonFeedback: '',
      questionsAsked: '',
      followUpActions: '',
    },
  ],

  marketing: [],

  socialMedia: [],

  feedback: {
    items: [],
    commonObjections: '',
    pricingFeedback: '',
    layoutFeedback: '',
    competingProperties: '',
    brokerSentiment: 'Week 3 spanned the July 4th holiday. Compass Insights show 729 total views — Realtor is now the leading traffic source (335), followed closely by Compass (199) and StreetEasy (195). Unique visitors up 52.8% week-over-week; average time on listing more than doubled (44s, +106%). Showings + open house detail to be added on receipt.',
    recommendedAdjustments: '',
  },

  digitalAds: {
    campaignName: 'Location-Based Targeting',
    targetingFocus: 'Upper West Side · Lincoln Square · Central Park West · Riverside · Columbus Ave',
    // Latest Compass Digital Ads pull — Jun 28 – Jul 4, 2026 (Databox).
    reportingPeriod: 'Jun 28 – Jul 4, 2026',
    totalImpressions: 10054,
    totalClicks: 183,
    topChannel: { name: 'nytimes.com', ctr: 1.82 },
    byChannel: [],
    // Top 12 publishers from the Jun 28 – Jul 4 Databox snapshot.
    topPublishers: [
      { publisher: 'nytimes.com',       views: 3758 },
      { publisher: 'nypost.com',        views: 952  },
      { publisher: 'foxnews.com',       views: 751  },
      { publisher: 'cnn.com',           views: 364  },
      { publisher: 'yahoo.com',         views: 314  },
      { publisher: 'theguardian.com',   views: 299  },
      { publisher: 'huffpost.com',      views: 273  },
      { publisher: 'thedailybeast.com', views: 259  },
      { publisher: 'cbssports.com',     views: 162  },
      { publisher: 'triblive.com',      views: 160  },
      { publisher: 'cnbc.com',          views: 144  },
      { publisher: 'pagesix.com',       views: 107  },
    ],
    audienceHouseholdIncome: [
      { bracket: 'Top 10%', share: 90.1 },
      { bracket: '11–20%',  share: 5.2  },
      { bracket: '21–30%',  share: 3.1  },
    ],
    socialTrafficPeriod: 'Jun 29 – Jul 5, 2026',
    socialTrafficShare: [],
  },

  marketActivity: {
    newListings: [],
    priceReductions: [],
    underContract: [],
    recentSales: [],
    neighborhoodTrends: '',
  },

  strategy: {
    keyRecommendations: '',
    marketingPlanNextWeek: '— Post-holiday re-engagement — reach back out to any Jun/early-Jul appointment holders\n— Location-based display campaign is efficient — 10K impressions / 1.82% CTR / 90% audience in the top 10% income bracket. Continue as-is\n— Refresh Instagram + Realtor.com creative to capture the audience quality Compass has already earned (44s average time on listing this week)\n— Weekly broker outreach to Upper West Side buyer agents',
    pricingStrategy: '',
    upcomingCampaigns: '',
    brokerEvents: '',
    openHousesPlanned: '— Public open house: Sunday July 12, 1:00–2:30 PM (first post-holiday weekend)',
  },
}
