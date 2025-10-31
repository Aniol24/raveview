import type { NextConfig } from "next"

const nextConfig = {
  images: {
    remotePatterns: [
      // 1001Tracklists OG/thumbs
      { protocol: 'https', hostname: 'cdn.1001tracklists.com' },

      // YouTube
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },

      // SoundCloud
      { protocol: 'https', hostname: 'i1.sndcdn.com' },

      // Mixcloud
      { protocol: 'https', hostname: 'thumbnailer.mixcloud.com' },
      { protocol: 'https', hostname: 'scdn.mixcloud.com' },
      { protocol: 'https', hostname: 'images.mixcloud.com' }, 
    ],
  },
}

export default nextConfig
