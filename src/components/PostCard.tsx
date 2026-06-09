// A single feed post card (/frontend/design-system). Title links to the post detail; shows date +
// tags + the markdown body. Reused by the feed list and the detail page.
import { Link as RouterLink } from 'react-router-dom';
import { Markdown } from './Markdown';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Badge from '@cloudscape-design/components/badge';
import Link from '@cloudscape-design/components/link';
import type { Post } from '../types/post';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export function PostCard({ post, linkTitle = true }: { post: Post; linkTitle?: boolean }) {
  return (
    <Container
      header={
        <Header variant="h2" description={fmtDate(post.created_at)}>
          {linkTitle ? (
            <Link fontSize="heading-m">
              <RouterLink to={`/posts/${post.post_id}`}>{post.title}</RouterLink>
            </Link>
          ) : (
            post.title
          )}
        </Header>
      }
    >
      <SpaceBetween size="s">
        {post.tags && post.tags.length > 0 && (
          <SpaceBetween size="xs" direction="horizontal">
            {post.tags.map((t) => (
              <Badge key={t} color="blue">
                {t}
              </Badge>
            ))}
          </SpaceBetween>
        )}
        <Box variant="p">
          <Markdown>{post.body}</Markdown>
        </Box>
      </SpaceBetween>
    </Container>
  );
}
