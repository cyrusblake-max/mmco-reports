import { WeeklyReport } from './types'

/**
 * 266 West 71st Street — second active MM&Co listing.
 * Fill in the property fields (price, beds, baths, sqft, listing date,
 * photo URL, description) in the editor or update this file directly.
 */
export const WEST71_REPORT: WeeklyReport = {
  id: 'west71-266-w1',
  weekNumber: 2,
  reportDate: '2026-06-23',
  // Reporting window: this past week (June 15 – June 21, 2026)
  weekStartDate: '2026-06-15',
  weekEndDate: '2026-06-21',

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

  // Week 2 (June 15 – 21):
  //   • Sunday open house (Jun 21) — 4 attendees
  //   • 3 private showings — including 2 visits from the same client (3rd scheduled)
  // Compass Insights (Jun 11 – 17): 770 total views,
  //   89 Compass / 415 Realtor / 264 StreetEasy / 2 Other.
  currentMetrics: {
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

  // Previous = Week 1 (since-listing report, Jun 2 – Jun 11) so WoW trends compute.
  previousMetrics: {
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
    brokerSentiment: 'Week 2: Sunday open house drew 4 attendees. Three additional private showings completed — including two visits from the same client with a third already scheduled. Repeat interest is the strongest signal so far.',
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
    marketingPlanNextWeek: '— Convert the repeat client — third showing is on the books, push for an offer conversation\n— Sunday open house drew 4 — keep weekly cadence to build a wider buyer pool\n— Realtor.com is now the dominant traffic source (415 views vs. 264 StreetEasy / 89 Compass) — explore boosting StreetEasy + Compass presence to broaden the funnel\n— Targeted broker outreach to agents with active Upper West Side buyers',
    pricingStrategy: '',
    upcomingCampaigns: '',
    brokerEvents: '',
    openHousesPlanned: '— Public open house: Sunday June 28, 1:00–2:30 PM\n— Third showing scheduled with the repeat-visit client',
  },
}
