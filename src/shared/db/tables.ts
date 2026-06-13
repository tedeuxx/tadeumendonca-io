// Table-name accessors. Names come from SSM → Lambda env at deploy (api.tf, /infrastructure/ssm);
// never hardcoded. Read at access time (a getter) so tests can run without the full env.

export const TABLES = {
  get profile() {
    return process.env.PROFILE_TABLE_NAME ?? '';
  },
  get posts() {
    return process.env.POSTS_TABLE_NAME ?? '';
  },
  get articles() {
    return process.env.ARTICLES_TABLE_NAME ?? '';
  },
  get subscriptions() {
    return process.env.SUBSCRIPTIONS_TABLE_NAME ?? '';
  },
  get audits() {
    return process.env.AUDITS_TABLE_NAME ?? '';
  },
  get comments() {
    return process.env.COMMENTS_TABLE_NAME ?? '';
  },
  get shortlinks() {
    return process.env.SHORTLINKS_TABLE_NAME ?? '';
  },
  get polls() {
    return process.env.POLLS_TABLE_NAME ?? '';
  },
};
