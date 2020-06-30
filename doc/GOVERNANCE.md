# Governence Policy System

## Data structure
There are one or more objects at the top-level.  

`default` is required.  The key of `all` will be applied to any request not found in the policy.

Policies are defined as a top-level object.  In this example below, there is another top-level section called `Permissive`.  The name is user defined.
The object `Permissive` must conform to the following structure:

```json
 [name] : {
    [key] : [always | once | deny ] 
}
```


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
[Source](src/controller/agent.governance.ts)


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
