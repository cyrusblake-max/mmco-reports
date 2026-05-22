/**
 * Instagram Graph API → recent media + insights for the connected account.
 *
 *   GET /api/instagram?token=...&hashtag=...
 *
 * The token must be a long-lived Instagram Graph API access token tied to an
 * Instagram Business or Creator account (linked via a Facebook Page).
 *
 * Optional `hashtag` filters posts whose caption includes the tag — useful
 * for pulling listing-specific posts only.
 *
 * Returns:
 *   {
 *     username, profilePicture, followersCount, totalPosts,
 *     posts: [{ id, caption, mediaUrl, permalink, likes, comments, reach, timestamp }]
 *   }
 *
 * Setup (one-time):
 *   1. https://developers.facebook.com/ → Create App → "Business"
 *   2. Add the "Instagram Graph API" product
 *   3. Use Graph API Explorer to mint a long-lived user token with these
 *      scopes: instagram_basic, instagram_manage_insights, pages_show_list,
 *      pages_read_engagement
 *   4. Paste the token into the "Connect Instagram" field in Section 05
 */

import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GRAPH = 'https://graph.facebook.com/v20.0'

interface MediaItem {
  id: string
  caption: string
  mediaUrl: string
  thumbnailUrl?: string
  permalink: string
  mediaType: string
  timestamp: string
  likes: number
  comments: number
  reach?: number
  impressions?: number
}

async function fb<T>(path: string, token: string, params: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ access_token: token, ...params }).toString()
  const r = await fetch(`${GRAPH}/${path}?${qs}`, { cache: 'no-store' })
  const body = await r.json()
  if (!r.ok) {
    const msg = body?.error?.message || `Graph API ${r.status}`
    throw new Error(msg)
  }
  return body as T
}

export async function GET(req: NextRequest) {
  const token   = req.nextUrl.searchParams.get('token')?.trim()
  const hashtag = req.nextUrl.searchParams.get('hashtag')?.trim().replace(/^#/, '').toLowerCase()

  if (!token) {
    return Response.json({
      error: 'Missing ?token=. Paste a long-lived Instagram Graph API user access token. See route source for setup steps.',
    }, { status: 400 })
  }

  try {
    // 1. Find the Facebook Page connected to the user's Instagram Business account
    const pages = await fb<{ data: { id: string; name: string; instagram_business_account?: { id: string } }[] }>(
      'me/accounts', token, { fields: 'id,name,instagram_business_account' },
    )
    const page = pages.data.find(p => p.instagram_business_account)
    if (!page?.instagram_business_account) {
      return Response.json({
        error: 'No Instagram Business account found on any of your Facebook Pages. Make sure your Instagram is a Business or Creator account linked to a Facebook Page.',
      }, { status: 400 })
    }
    const igId = page.instagram_business_account.id

    // 2. Account-level profile
    const profile = await fb<{
      username: string; followers_count: number; media_count: number; profile_picture_url: string
    }>(igId, token, { fields: 'username,followers_count,media_count,profile_picture_url' })

    // 3. Recent media
    const mediaRes = await fb<{
      data: {
        id: string; caption?: string; media_url: string; thumbnail_url?: string;
        permalink: string; media_type: string; timestamp: string;
        like_count?: number; comments_count?: number;
      }[]
    }>(`${igId}/media`, token, {
      fields: 'id,caption,media_url,thumbnail_url,permalink,media_type,timestamp,like_count,comments_count',
      limit: '25',
    })

    let posts: MediaItem[] = mediaRes.data.map(m => ({
      id: m.id,
      caption: m.caption ?? '',
      mediaUrl: m.media_url,
      thumbnailUrl: m.thumbnail_url,
      permalink: m.permalink,
      mediaType: m.media_type,
      timestamp: m.timestamp,
      likes:    m.like_count ?? 0,
      comments: m.comments_count ?? 0,
    }))

    if (hashtag) {
      posts = posts.filter(p => p.caption.toLowerCase().includes('#' + hashtag) || p.caption.toLowerCase().includes(hashtag))
    }

    // 4. Per-post insights (reach + impressions) — best-effort
    await Promise.all(posts.slice(0, 10).map(async p => {
      try {
        const ins = await fb<{ data: { name: string; values: { value: number }[] }[] }>(
          `${p.id}/insights`, token, { metric: 'reach,impressions' },
        )
        for (const d of ins.data) {
          const v = d.values?.[0]?.value
          if (d.name === 'reach')        p.reach = v
          if (d.name === 'impressions')  p.impressions = v
        }
      } catch { /* insights unavailable for some media types — ignore */ }
    }))

    // 5. Aggregate totals across the returned posts
    const totals = posts.reduce(
      (acc, p) => ({
        likes:       acc.likes + p.likes,
        comments:    acc.comments + p.comments,
        reach:       acc.reach + (p.reach ?? 0),
        impressions: acc.impressions + (p.impressions ?? 0),
      }),
      { likes: 0, comments: 0, reach: 0, impressions: 0 },
    )

    return Response.json({
      username:       profile.username,
      profilePicture: profile.profile_picture_url,
      followersCount: profile.followers_count,
      totalPosts:     profile.media_count,
      postsReturned:  posts.length,
      totals,
      posts,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: msg }, { status: 500 })
  }
}
