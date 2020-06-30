# Governence Policy System

## Data structure
There are one or more objects at the top-level.  

`default` is required.  The key of `all` specifies what value will be applied to permission request not found in the policy.  If `all`
is missing, it will be created with the value of `deny`.

Policies are defined as a top-level object. The name is user defined.  Policies must conform to the following structure. 

```json
 [name] : {
    [key] : [always | once | deny ] 
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
    "invitation": "always",
    "create-proof": "always"
  }
}
```

## Code
[Source](../src/controller/agent.governance.ts)


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
