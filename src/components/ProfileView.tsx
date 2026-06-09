// Presentational CV — renders a Profile with the Cloudscape design system (/frontend/design-system).
// Pure component (data comes from the page), so it's trivially testable.
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Box from '@cloudscape-design/components/box';
import Badge from '@cloudscape-design/components/badge';
import Link from '@cloudscape-design/components/link';
import type { Profile } from '../types/profile';

function dateRange(start: string, end: string | null): string {
  return `${start} – ${end ?? 'Present'}`;
}

export function ProfileView({ profile }: { profile: Profile }) {
  return (
    <SpaceBetween size="l">
      <Container
        header={
          <Header variant="h1" description={profile.headline}>
            {profile.name}
          </Header>
        }
      >
        <SpaceBetween size="s">
          {profile.summary && <Box variant="p">{profile.summary}</Box>}
          {profile.location && (
            <Box color="text-body-secondary" fontSize="body-s">
              {profile.location}
            </Box>
          )}
          {Object.keys(profile.metadata).length > 0 && (
            <SpaceBetween size="xs" direction="horizontal">
              {Object.entries(profile.metadata).map(([key, url]) => (
                <Link key={key} href={url} external>
                  {key}
                </Link>
              ))}
            </SpaceBetween>
          )}
        </SpaceBetween>
      </Container>

      {profile.experience.length > 0 && (
        <Container header={<Header variant="h2">Experience</Header>}>
          <SpaceBetween size="m">
            {profile.experience.map((item, i) => (
              <div key={i}>
                <Box variant="h4">
                  {item.title} · {item.company}
                </Box>
                <Box color="text-body-secondary" fontSize="body-s">
                  {dateRange(item.start_date, item.end_date)}
                </Box>
                {item.description && <Box variant="p">{item.description}</Box>}
                {item.highlights && item.highlights.length > 0 && (
                  <ul>
                    {item.highlights.map((h, j) => (
                      <li key={j}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </SpaceBetween>
        </Container>
      )}

      {profile.education.length > 0 && (
        <Container header={<Header variant="h2">Education</Header>}>
          <SpaceBetween size="m">
            {profile.education.map((item, i) => (
              <div key={i}>
                <Box variant="h4">
                  {item.degree}
                  {item.field ? `, ${item.field}` : ''} · {item.institution}
                </Box>
                <Box color="text-body-secondary" fontSize="body-s">
                  {dateRange(item.start_date, item.end_date)}
                </Box>
              </div>
            ))}
          </SpaceBetween>
        </Container>
      )}

      {profile.certifications.length > 0 && (
        <Container header={<Header variant="h2">Certifications</Header>}>
          <SpaceBetween size="s">
            {profile.certifications.map((item, i) => (
              <Box key={i}>
                {item.credential_url ? (
                  <Link href={item.credential_url} external>
                    {item.name}
                  </Link>
                ) : (
                  item.name
                )}{' '}
                · {item.issuer} ({item.issued_date})
              </Box>
            ))}
          </SpaceBetween>
        </Container>
      )}

      {Object.keys(profile.skills).length > 0 && (
        <Container header={<Header variant="h2">Skills</Header>}>
          <ColumnLayout columns={2} borders="horizontal">
            {Object.entries(profile.skills).map(([category, list]) => (
              <div key={category}>
                <Box variant="h4">{category}</Box>
                <SpaceBetween size="xxs" direction="horizontal">
                  {list.map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))}
                </SpaceBetween>
              </div>
            ))}
          </ColumnLayout>
        </Container>
      )}
    </SpaceBetween>
  );
}
