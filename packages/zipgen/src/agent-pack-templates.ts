/**
 * AgentPack template content - matches free-sample-v1.2.0 structure
 */

export const SOUL_PACK_DEFAULTS = `# SOUL.md — Pack Defaults

Core principles for all agents in this pack.

## Be Useful, Not Performative

- Lead with the answer, not filler
- Skip "Great question!" and "I'd be happy to help!"
- Respect people's time

## Be Clear

- Concise over verbose
- Use formatting (bullets, headers, bold) for readability
- Structure long responses so they're scannable

## Be Honest

- Own your answers with confidence
- When uncertain, say so directly
- Don't make things up — "I don't know" is valid

## Be Proactive

- Anticipate what might be needed next
- Offer useful follow-ups
- Ask clarifying questions when the request is ambiguous

## Ask Before Destroying

- Confirm before deleting files or data
- Preview destructive actions
- Prefer recoverable operations (trash > rm)
`;

export const USER_MD = `# USER.md — About You

Help your agents understand who they're working with.

- **Name:** 
- **What to call you:** 
- **Timezone:** 
- **Pronouns:** (optional)

## What You Do

<!-- Your work, projects, or what you'll use the agents for -->

## Preferences

<!-- How you like to communicate, formatting preferences, etc. -->

## Links

<!-- Your website, GitHub, social media, or anything agents might reference -->

---

*Tip: The more context you provide, the more useful your agents become.*
`;

export const TOOLS_MD = `# TOOLS.md — Environment Notes

Use this file to store environment-specific information your agents might need.

## Repos & Projects

<!-- 
- main-app: ~/projects/my-app
- website: ~/projects/website
-->

## Common Commands

<!--
- Deploy: \`npm run deploy\`
- Test: \`npm test\`
-->

## Accounts & Services

<!--
- Hosting: Vercel
- Database: Supabase
- Email: Resend
-->

## Notes

<!-- Any other context that helps your agents work in your environment -->
`;

export const MEMORY_MD = `# MEMORY.md — Long-Term Memory

Use this file to store important context that should persist across sessions.

## About You
<!-- Add details about yourself that your agents should remember -->

## Projects
<!-- Current projects, goals, and context -->

## Preferences
<!-- Communication style, tone preferences, etc. -->

## Notes
<!-- Anything else worth remembering -->

---

*Tip: Your agents can read and update this file. Ask them to "remember this" and they'll add it here.*
`;

export const HEARTBEAT_MD = `# HEARTBEAT.md

# Keep this file empty (or with only comments) to skip heartbeat API calls.
# Add tasks below when you want the agent to check something periodically.
`;

export const OPENCLAW_CHANNELS_TEMPLATE = `// OpenClaw Channel Config Template
//
// Pick your preferred messaging platform, fill in the credentials,
// and merge into your openclaw.json under the "channels" key.
//
// Docs: https://docs.openclaw.ai/channels

{
  channels: {
    discord: {
      enabled: false,
      token: "\${DISCORD_BOT_TOKEN}",
      guilds: {
        "*": {
          channels: {
            "general": { allow: true }
          }
        }
      }
    },
    telegram: {
      enabled: false,
      token: "\${TELEGRAM_BOT_TOKEN}",
      dm: { policy: "pairing" }
    },
    whatsapp: {
      enabled: false,
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"]
    },
    slack: { enabled: false },
    signal: { enabled: false }
  }
}
`;
