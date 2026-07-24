# The IaC deploy policy (`tadeumendonca-iac-deploy`)

`iac-deploy-policy.json` is the desired document for the managed policy
`arn:aws:iam::858049036700:policy/tadeumendonca-iac-deploy`, attached to the infra OIDC role
(`AWS_INFRA_OIDC_ROLE_ARN`) that GitHub Actions assumes to run `infra-plan` and `infra-apply`.

## Why it is applied out-of-band (not in `iac/`)

This is the policy of the role that *runs* Terraform. Terraform cannot bootstrap its own permissions —
the role must already be able to read/write AWS before the first `apply`. So this one policy is applied
by hand (owner, via the CLI below); everything else it grants is what lets `iac/` manage the rest. The
JSON here is the source of truth for what *should* be attached; AWS is the source of truth for what *is*.

## Least privilege — and the one asymmetry to know

Every statement is scoped to concrete ARNs. The `Iam*` statements are the sharp edge: they are split by
resource type so the role can only touch the IAM entities `iac/iam.tf` actually manages —

- **`IamRoles`** → `role/github-actions-tadeumendonca-io-fed` (the one managed role; the name is
  env-independent). Exact ARN, *not* a `github-actions-tadeumendonca-*` wildcard: the wildcard would also
  match the infra role itself, letting it rewrite or delete its own trust — a self-escalation path.
- **`IamPolicies`** → `policy/tadeumendonca-fed-deploy-*` (covers the staging + production names). *Not*
  `tadeumendonca-*`: that would match `tadeumendonca-iac-deploy` itself, letting the role rewrite the very
  policy that constrains it.
- **`IamOidcProvider`** → the specific `oidc-provider/token.actions.githubusercontent.com`.
- **`IamList`** → `iam:ListRoles`, `iam:ListOpenIDConnectProviders` on `*` — list APIs have no
  resource-level form, so `*` is the tightest possible.

**The proof asymmetry (this is what has bitten this policy repeatedly):** `infra-plan` exercises only the
*read* path (Get/List) of these actions during its refresh. The *write* path (Create/Update/Delete/Tag/
Attach) runs only on a real `infra-apply` that mutates the fed role/policy — which does not happen on a
docs-only change. So a green `infra-plan` after applying a new version proves the read scoping, not the
write scoping. To keep the write path safe without being able to prove it here, the **action set is left
complete** — this change tightens only the *Resource*, never removes an action. A future `apply` that adds
or changes a fed IAM resource is where a missing action would surface (AccessDenied names it exactly);
that is the moment to widen, not on a guess.

## Applying a new version (owner)

AWS keeps at most **5** versions per policy. If full, free a slot first (the CI role is denied
`DeletePolicyVersion` by the guard, so this is yours):

```
# inspect versions; note the current default (for rollback) and pick a stale non-default to remove
aws iam list-policy-versions --policy-arn arn:aws:iam::858049036700:policy/tadeumendonca-iac-deploy

# free a slot if at 5/5
aws iam delete-policy-version --policy-arn arn:aws:iam::858049036700:policy/tadeumendonca-iac-deploy --version-id vN

# apply this file as the new default
aws iam create-policy-version --policy-arn arn:aws:iam::858049036700:policy/tadeumendonca-iac-deploy \
  --policy-document file://docs/iac-deploy-policy.json --set-as-default
```

Then prove the read path: open (or re-run) any PR that touches `iac/` and confirm `infra-plan` is green
(its OIDC step assumed the role and `terraform plan` refreshed state). A red `AccessDenied` names any
over-tightened action; roll back with:

```
aws iam set-default-policy-version --policy-arn arn:aws:iam::858049036700:policy/tadeumendonca-iac-deploy --version-id <previous-default>
```
