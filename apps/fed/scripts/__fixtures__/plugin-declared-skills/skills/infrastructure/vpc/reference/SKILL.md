---
description: A SKILL.md INSIDE a declared skill's own supporting directory. Not a skill — it is material the vpc skill ships, and the collector must not treat it as an undeclared skill.
---

This file is the whole point of the fixture. Without it the non-descent assertion cannot
fail: a supporting directory holding no SKILL.md yields nothing whether the walk descends
into a skill directory or stops at it, so the test would be green about a property the
tree never exercised.
