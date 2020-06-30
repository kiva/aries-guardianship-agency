# Governance Policy System

## Data structure
There are one or more objects at the top-level.  

`default` is required.  The key of `all` specifies what value will be applied to permission request not found in the policy.  If `all`
is missing, it will be created with the value of `deny`.

Policies are defined as top-level objects. The name is user defined.  Policies are collections of topics.
Topics are also user defined.  Topics are the final level in the policy definition and these key value paris where the key is user defined value and
the value is one of `[always | once | deny]` as documented below: 

```json
 [name] : {
    [topic] {
      [key] : [always | once | deny ]
    } 
}
```

Here is an example that contains a user defined policy called 'Permissive'.  

```json
{
  "comment": "The default section is required.  The others are defined as needed. So in this example, Permissive and SierraLeone as user defined sections. The valid values for keys in a section are always, once, deny",
  "default" : {
    "comment": "this section is the default which will apply when a policy requested is missing or when an action in a policy is missing",
    "all": "deny"
  },
  "Permissive": {
    "connections": {
      "invitation": "always",
      "request": "always"
    }
  }
}
```

### About `once`
The `once` value is unique.  When a permission is queried (via `getPermission(...)` API call), the value for that key is updated to `deny`.

## Code
[Source](../src/controller/agent.governance.ts)

### Example use cases
See the governance [unit tests](../test/agents.e2e-spec.ts)

## Future changes

In the future, we may want to have assignable behaviors to a policy.  Here's one thought on how that might be structured.

```json
 [name] : {
    [key] : {
      "permission": [always | once | deny ],
      "action": [user defined data]
    } 
}
```
