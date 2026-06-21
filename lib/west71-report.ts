import { WeeklyReport } from './types'

/**
 * 266 West 71st Street — second active MM&Co listing.
 * Fill in the property fields (price, beds, baths, sqft, listing date,
 * photo URL, description) in the editor or update this file directly.
 */
export const WEST71_REPORT: WeeklyReport = {
  id: 'west71-266-w1',
  weekNumber: 1,
  reportDate: '2026-06-11',
  // Reporting window: since listing date (June 2 – June 11, 2026)
  weekStartDate: '2026-06-02',
  weekEndDate: '2026-06-11',

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

  // Since listing (June 2 – June 11): four private showings + one preview — all positive feedback.
  // Compass Insights: 831 total views, 54 unique visitors,
  // 96 Compass / 280 Realtor / 453 StreetEasy / 2 Other.
  // Top traffic source: Compass (88%); top social channel: Instagram (100%).
  currentMetrics: {
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

  previousMetrics: undefined,

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
  ],

  includedSections: {
    propertyOverview: false,
    weeklySnapshot:   true,
    openHouses:       true,
    marketing:        false,
    socialMedia:      false,
    digitalAds:       false,
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
  ],

  marketing: [],

  socialMedia: [],

  feedback: {
    items: [],
    commonObjections: '',
    pricingFeedback: '',
    layoutFeedback: '',
    competingProperties: '',
    brokerSentiment: 'Since listing: four private showings plus one preview — all reported positive feedback. Strong engagement and continued interest from prospective buyers.',
    recommendedAdjustments: '',
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
    marketingPlanNextWeek: '— Maintain private showing momentum (4 private showings + 1 preview since listing, all positive feedback)\n— Continue to leverage StreetEasy as the primary traffic source (453 views since listing)\n— Build out Instagram presence — currently driving 100% of social traffic\n— Targeted broker outreach to agents with active Upper West Side buyers',
    pricingStrategy: '',
    upcomingCampaigns: '',
    brokerEvents: '',
    openHousesPlanned: '— No open house this weekend — focus on continued private appointment scheduling',
  },
}
