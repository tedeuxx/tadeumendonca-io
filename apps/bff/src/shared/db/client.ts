// Module-level DynamoDBDocumentClient singleton — reused across warm invocations (connection
// keep-alive). No connect()/secret: the SDK signs with the Lambda exec-role creds from the runtime
// (pure IAM). lib-dynamodb marshals plain JS ⇄ DynamoDB attribute types (snake_case all the way).
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const base = new DynamoDBClient({});

export const ddb = DynamoDBDocumentClient.from(base, {
  marshallOptions: { removeUndefinedValues: true },
});
