# sprint-06 — funnel review

commit: c94d4be9967140bebe7539cd402761c7c27d9f32
collection: docs/funnel-review/collected/sprint-06.tsv
cap: 2 findings, the ceiling and not a quota
internal-traffic: testing-excluded-by-query 2026-10-15 every published funnel figure is the all-users value less the visible GA4 test-data-filter comparison for Internal Traffic

FUNNEL-REVIEW-RAN

The surfaces were read and this report is the analysis of what came back. Every figure below
carries its sample size and its consent ceiling; a figure that arrived without a sample size is
listed as unusable rather than printed as a figure.

## Figures

- ga4 · sessions = 3 · n=3 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · marked_internal_sessions = 1 · n=4 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · sessions_source_l_instagram_referral = 2 · n=3 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · sessions_source_direct_none = 1 · n=3 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · sessions_source_linkedin_social = 0 · n=3 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · linkedin_sessions = 0 · n=3 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · linkedin_landing_en_blog_what_my_agents_do = 0 · n=3 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_count = 8 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · marked_internal_events = 13 · n=21 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_article_progress = 1 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_page_view = 3 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_session_start = 3 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_user_engagement = 1 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_scroll = 0 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_article_end_reached = 0 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_share_complete = 0 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_contact_click = 0 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_share_open = 0 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_contact_reach = 0 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_outbound_click = 0 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · event_nav_click = 0 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design
- ga4 · key_events = 0 · n=8 · no prior period on record · consent-ceiling: consenting sessions only — the consent banner gates analytics on this site, so a reader who declined is invisible by design

## Findings

### Finding 1 — The measured funnel stops before its completion and action signals

After internal traffic is excluded, the period contains one reading-progress event
(`event_article_progress = 1`, n=8), but no measured article completion, share, contact, outbound-link,
or navigation event (each `0`, n=8). This costs the
presence any evidence that the observed attention reached the detailed layer or became an action. Keep
this as a baseline and prioritize the already-open consumer declarations/store work before changing
content: the current collection still cannot locate the drop by piece and language.

### Finding 2 — Acquisition exists, but the sample cannot support a channel decision

The site recorded three external consenting sessions after the test filter comparison: two from
Instagram referral and one direct (`sessions = 3`, n=3). The sole all-users LinkedIn session was marked
internal, leaving `linkedin_sessions = 0`, n=3, and
`linkedin_landing_en_blog_what_my_agents_do = 0`, n=3. Treat this as no measured external LinkedIn
reach, not evidence that Instagram is the better channel. The cost of acting now is optimizing against
three sessions; preserve the acquisition breakdown and compare the next period on the same definitions.

## What I would leave alone

Do not change the published-voice ruler from this period. There is no prior consumer baseline, the
external site-side sample is three consenting sessions, and LinkedIn post metrics were unavailable
because that surface was not authenticated. No candidate rule is proposed.

---

This rite returns no verdict and gates nothing. It produces observations for the owner and
nothing else — the same constraint `/sprint-review` carries, for the same reason: marketing
judgement has no ruler, and a gate with no ruler grades taste.
Nothing here files an Issue. Only the owner opens work.
