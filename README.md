# Hybrid Auth Container

A container for React and React Native

## How it works

After you defined a view for each case, the container will inject the props on your view, enabling functions to authenticate the user and callbacks to deal with this authentications.

```jsx
<AuthContainer
    redirectView={() => (<div />)}
    routeAfterCheck={'login'}
    loginView={Login}
    onRouteChange={(route) => this.setState({ route })}
    route={this.state.route}
    onUserAuthenticated={(authObj) => this.onUserAuthenticated(authObj)}
    checkUser={()=>this.checkUser()}
    validateUser={(user) => this.validateUser(user)} />
```
## Container Props

- `route` (string) - current route. Default routes:
    - **"redirect"** - View that is shown when checking if user is authenticated
    - **"login"** - Login View
    - **"signUp"** - SignUp View
    - **"recoverPassword"** - Password recovery steps

- `checkUser`(function) - function to check if user is logged (check on session or cache...)
- `routeAfterCheck` (string) - route to send user if it's not authenticated (checked on `redirectView`)
- `validateUser` (function) - will receive a user and return true or false, checking if it's a valid user
- `validateEmail` (function) - will receive a email and return true or false, checking if it's a valid email

### Callbacks
- `onUserAuthenticated` - generic callback that will be called wherever the user is authenticated
- `onLoginFailed`
- `onLoginSuccess`
- `onSocialLoginFailed`
- `onSocialLoginSuccess`
- `onSingUpFailed`  
- `onSingUpSuccess` 
- `onPasswordResetFail` 

- `onRouteChange`
- `onStepChange`

### Views

Views can be passed as props or children component. If passed as props, the name of prop will be `route + 'View'`. Examples:
- loginView
- signUpView
- redirectView
- recoverPasswordView


### View Props

Props that the container will inject on the view inside `auth` object.

- `loading` - true if the http request is loading
- `error` - error object on App Masters pattern
- `getFieldError` - function to get error from a specific field
- `changeRoute` - function to change route. Will trigger the `onRouteChange` callback

#### On login view

- `doLogin` - login function using email and password
- `doSocialLogin` - login/sign up using a social network. Pass the user object and a string with the network used, like "facebook"

#### On signUp view

- `doSignUp` - sing up function using email and password
- `doSocialLogin` - login/sign up using a social network. Pass the user object and a string with the network used, like "facebook"

#### On recoverPassword view

- `changeStep`
- `recoveryStep`
- `requestCode`
- `validateCode`
- `resetPassword`
