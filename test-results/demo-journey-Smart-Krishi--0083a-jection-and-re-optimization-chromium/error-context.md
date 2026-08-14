# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo-journey.spec.ts >> Smart Krishi-Yatra AI Demo Journey >> Farmer Journey: calculation, delay injection, and re-optimization
- Location: tests\demo-journey.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: /Open Farmer Portal/i })

```

# Page snapshot

```yaml
- generic [ref=e2]:
    - generic [ref=e4]:
        - generic [ref=e5]:
            - generic [ref=e6]:
                - button "System History" [ref=e7] [cursor=pointer]
                - button "Mini Game" [ref=e8] [cursor=pointer]
                - button "Fullscreen" [ref=e9] [cursor=pointer]
            - generic: 📂 Paper Archive — Dashboard
        - generic [ref=e10]:
            - button "Back" [ref=e11] [cursor=pointer]
            - button "Forward" [ref=e14] [cursor=pointer]
            - generic [ref=e17]:
                - generic [ref=e18] [cursor=pointer]: 📂 Paper Archive
                - generic [ref=e19]:
                    - generic [ref=e20]: /
                    - generic [ref=e21] [cursor=pointer]: Dashboard
            - generic [ref=e22]:
                - button "Grid view" [ref=e23] [cursor=pointer]
                - button "List view" [ref=e26] [cursor=pointer]
            - textbox "Search papers..." [ref=e32]
        - generic [ref=e33]:
            - complementary [ref=e34]:
                - generic [ref=e35]:
                    - generic [ref=e36]: Favorites
                    - link "🏠 Dashboard" [ref=e37] [cursor=pointer]:
                        - /url: /dashboard
                        - generic [ref=e38]: 🏠
                        - text: Dashboard
                    - link "📁 Study Hub" [ref=e39] [cursor=pointer]:
                        - /url: /papers
                        - generic [ref=e40]: 📁
                        - text: Study Hub
                    - link "🗺️ Roadmap" [ref=e41] [cursor=pointer]:
                        - /url: /roadmap
                        - generic [ref=e42]: 🗺️
                        - text: Roadmap
                    - link "🏆 Leaderboard" [ref=e43] [cursor=pointer]:
                        - /url: /leaderboard
                        - generic [ref=e44]: 🏆
                        - text: Leaderboard
                    - link "💬 Forum" [ref=e45] [cursor=pointer]:
                        - /url: /forum
                        - generic [ref=e46]: 💬
                        - text: Forum
                    - link "👥 Community" [ref=e47] [cursor=pointer]:
                        - /url: /community
                        - generic [ref=e48]: 👥
                        - text: Community
                - generic [ref=e49]:
                    - generic [ref=e50]: Account
                    - link "🔑 Sign In" [ref=e51] [cursor=pointer]:
                        - /url: /login
                        - generic [ref=e52]: 🔑
                        - text: Sign In
                - generic [ref=e54]:
                    - link "Terms" [ref=e55] [cursor=pointer]:
                        - /url: /terms
                    - link "Privacy" [ref=e56] [cursor=pointer]:
                        - /url: /privacy
                    - link "Honor Code" [ref=e57] [cursor=pointer]:
                        - /url: /honor-code
            - main [ref=e58]:
                - generic [ref=e59]:
                    - generic [ref=e60]:
                        - generic [ref=e61]:
                            - generic [ref=e62]:
                                - generic [ref=e63]: Paper Archive v2
                                - generic [ref=e65]: Online
                            - heading "Find the right file, fast." [level=1] [ref=e66]
                            - paragraph [ref=e67]: 0 resources · 0 active users
                            - generic [ref=e68]:
                                - textbox "Search past papers, notes, syllabi..." [ref=e73]
                                - button "Search" [ref=e74] [cursor=pointer]
                            - generic [ref=e75]:
                                - link "🎮 Discord" [ref=e76] [cursor=pointer]:
                                    - /url: https://discord.gg/your_discord_invite
                                    - generic [ref=e77]: 🎮
                                    - text: Discord
                                - link "WhatsApp" [ref=e78] [cursor=pointer]:
                                    - /url: https://chat.whatsapp.com/your-invite
                        - generic [ref=e81]:
                            - generic [ref=e82]:
                                - generic [ref=e83]: 📁
                                - generic [ref=e84]: "0"
                                - generic [ref=e85]: Resources
                            - generic [ref=e86]:
                                - generic [ref=e87]: 👥
                                - generic [ref=e88]: "0"
                                - generic [ref=e89]: Users
                    - generic [ref=e90]:
                        - heading "Quick Access" [level=2] [ref=e92]
                        - generic [ref=e94]:
                            - link "📁 Study Hub PAPERS" [ref=e95] [cursor=pointer]:
                                - /url: /papers
                                - generic [ref=e96]:
                                    - generic [ref=e97]: 📁
                                    - generic [ref=e98]: Study Hub
                                    - generic [ref=e99]: PAPERS
                            - link "📄 Past Papers EXAMS" [ref=e100] [cursor=pointer]:
                                - /url: /papers?type=PAPER
                                - generic [ref=e101]:
                                    - generic [ref=e102]: 📄
                                    - generic [ref=e103]: Past Papers
                                    - generic [ref=e104]: EXAMS
                            - link "📓 Notes NOTES" [ref=e105] [cursor=pointer]:
                                - /url: /papers?type=NOTE
                                - generic [ref=e106]:
                                    - generic [ref=e107]: 📓
                                    - generic [ref=e108]: Notes
                                    - generic [ref=e109]: NOTES
                            - link "🗺️ Roadmap ROADMAP" [ref=e110] [cursor=pointer]:
                                - /url: /roadmap
                                - generic [ref=e111]:
                                    - generic [ref=e112]: 🗺️
                                    - generic [ref=e113]: Roadmap
                                    - generic [ref=e114]: ROADMAP
                            - link "💬 Forum FORUM" [ref=e115] [cursor=pointer]:
                                - /url: /forum
                                - generic [ref=e116]:
                                    - generic [ref=e117]: 💬
                                    - generic [ref=e118]: Forum
                                    - generic [ref=e119]: FORUM
                            - link "🏆 Leaderboard RANKS" [ref=e120] [cursor=pointer]:
                                - /url: /leaderboard
                                - generic [ref=e121]:
                                    - generic [ref=e122]: 🏆
                                    - generic [ref=e123]: Leaderboard
                                    - generic [ref=e124]: RANKS
                            - link "👥 Community PEOPLE" [ref=e125] [cursor=pointer]:
                                - /url: /community
                                - generic [ref=e126]:
                                    - generic [ref=e127]: 👥
                                    - generic [ref=e128]: Community
                                    - generic [ref=e129]: PEOPLE
                    - generic [ref=e130]:
                        - generic [ref=e131]:
                            - heading "Recently Added" [level=2] [ref=e132]
                            - link "View All" [ref=e134] [cursor=pointer]:
                                - /url: /papers
                        - generic [ref=e135]:
                            - generic [ref=e136]:
                                - generic [ref=e137] [cursor=pointer]: Name
                                - generic [ref=e138] [cursor=pointer]: Type
                                - generic [ref=e139] [cursor=pointer]: Uploaded by
                                - generic [ref=e140] [cursor=pointer]: Date
                            - generic [ref=e142]:
                                - generic [ref=e143]: ⚠️
                                - generic [ref=e144]: Connection Error
                                - generic [ref=e145]: Failed to load stats.
        - generic [ref=e146]:
            - generic [ref=e147]: Made with locally
            - generic [ref=e150]:
                - generic [ref=e151]: Dashboard
                - generic [ref=e152]: "|"
                - generic [ref=e153]: Paper Archive v2.0
                - generic [ref=e154]: "|"
                - link "MIT License" [ref=e155] [cursor=pointer]:
                    - /url: /legal
    - button "AI Tutor" [ref=e156] [cursor=pointer]
```
