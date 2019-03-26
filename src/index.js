import React, {Component} from 'react';
import {Http} from '@app-masters/js-lib';

class AuthContainer extends Component {
    constructor (props) {
        super(props);
        this.checkContainerProps(props);
        this.state = {
            route: this.props.route || 'redirect',
            auth: null,
            loading: false,
            error: null,
            code: null,
            step: this.props.step || 1
        };
        // Bind of defined methods
        this.checkContainerProps = this.checkContainerProps.bind(this);
        this.checkAndCallPropFunction = this.checkAndCallPropFunction.bind(this);
        this.doLogin = this.doLogin.bind(this);
        this.doSocialLogin = this.doSocialLogin.bind(this);
        this.doSignUp = this.doSignUp.bind(this);
        this.requestPasswordRequestCode = this.requestPasswordRequestCode.bind(this);
        this.requestPasswordValidateCode = this.requestPasswordValidateCode.bind(this);
        this.resetPasswordWithCode = this.resetPasswordWithCode.bind(this);
        this.getView = this.getView.bind(this);
        this.mountProps = this.mountProps.bind(this);
        this.changeStep = this.changeStep.bind(this);
        this.changeRoute = this.changeRoute.bind(this);
        this.getFieldError = this.getFieldError.bind(this);
    }

    componentDidMount () {
        if (this.state.route === 'redirect') {
            this.checkAndRedirect();
        }
    }

    /**
     * Check if props are valid and throw error
     * @param props
     * @returns {boolean}
     */
    checkContainerProps (props) {
        return true;
    }

    /**
     * Check if auth object is defined, if it's not, redirect to singUp
     */
    async checkAndRedirect () {
        if (this.state.auth) {
            // User is checked and is authenticated. Continue.
            this.checkAndCallPropFunction('onUserAuthenticated', this.state.auth);
        } else {
            // User is not checked yet.
            const auth = await this.checkAndCallPropFunction('checkUser');
            if (auth) {
                this.setState({auth});
                this.checkAndCallPropFunction('onUserAuthenticated', this.state.auth);
            } else {
                this.changeRoute(this.props.routeAfterCheck || 'signUp');
            }
        }
    }

    /**
     * Check if optional callback function is defined
     * @param functionName
     * @param parameters
     */
    checkAndCallPropFunction (functionName, ...parameters) {
        if (this.props[functionName] && (typeof this.props[functionName]) === 'function') {
            return this.props[functionName](...parameters);
        } else {
            return () => null;
        }
    }

    /**
     * Login user and call defined callbacks
     * @param userObject
     * @returns {Promise<null>}
     */
    async doLogin (userObject) {
        this.setState({loading: true, error: null});

        // Validate body
        const errorObject = this.props.validateUser(userObject, this.state.route);

        if (errorObject) {
            // Body is not a valid object
            this.setState({loading: false, error: errorObject});
            await this.checkAndCallPropFunction('onLoginFailed', errorObject);
            return null;
        } else {
            // Login user
            const apiUrl = this.props.loginUrl || '/auth/login';
            try {
                const response = await Http.post(apiUrl, userObject);
                await this.checkAndCallPropFunction('onLoginSuccess', response);
                await this.checkAndCallPropFunction('onUserAuthenticated', response);
                this.setState({loading: false, auth: response});
            } catch (error) {
                this.setState({loading: false, error: error});
                this.checkAndCallPropFunction('onLoginFailed', error);
            }
        }
    }

    /**
     * Login user on defined social network (google, facebook), may be a sign-up
     * @param userObject
     * @param network
     * @returns {Promise<null>}
     */
    async doSocialLogin (userObject, network) {
        this.setState({loading: true, error: null});

        // Validate body
        const errorObject = this.props.validateUser(userObject, network);

        if (errorObject) {
            // Body is not a valid object
            this.setState({loading: false, error: errorObject});
            await this.checkAndCallPropFunction('onSocialLoginFailed', errorObject);
            return null;
        } else {
            // Login user
            const apiUrl = this.props.socialLoginUrl || '/auth/loginsocial';
            try {
                const response = await Http.post(apiUrl, { network, ...userObject });
                await this.checkAndCallPropFunction('onSocialLoginSuccess', response);
                await this.checkAndCallPropFunction('onUserAuthenticated', response);
                this.setState({loading: false, auth: response});
            } catch (error) {
                this.setState({loading: false, error: error});
                this.checkAndCallPropFunction('onSocialLoginFailed', error);
            }
        }
    }

    /**
     * Sign up user, creating a new user and call defined callbacks
     * @param userObject
     * @returns {Promise<null>}
     */
    async doSignUp (userObject) {
        this.setState({loading: true, error: null});

        // Validate body
        const errorObject = this.props.validateUser(userObject, this.state.route);

        if (errorObject) {
            // Body is not a valid object
            this.setState({loading: false, error: errorObject});
            await this.checkAndCallPropFunction('onSingUpFailed', errorObject);
            return null;
        } else {
            // Sign up user
            const apiUrl = this.props.signUpUrl || '/auth/signup';
            try {
                const response = await Http.post(apiUrl, userObject);
                await this.checkAndCallPropFunction('onSingUpSuccess', response);
                await this.checkAndCallPropFunction('onUserAuthenticated', response);
                this.setState({loading: false, auth: response});
            } catch (error) {
                this.setState({loading: false, error: error});
                this.checkAndCallPropFunction('onSingUpFailed', error);
            }
        }
    }

    /**
     * First step of password recovery, sending a code to defined email
     * @param email
     * @returns {Promise<null>}
     */
    async requestPasswordRequestCode (email) {
        this.setState({loading: true, error: null});

        // Validate body
        const errorObject = this.props.validateEmail(email);

        if (errorObject) {
            // Body is not a valid object
            this.setState({loading: false, error: errorObject});
            await this.checkAndCallPropFunction('onPasswordResetFail', errorObject);
            return null;
        } else {
            // Request code
            const apiUrl = this.props.requestCodeUrl || '/auth/requestpassword';
            try {
                await Http.post(apiUrl, {email: email});
                this.changeStep(2);
                this.setState({loading: false, email: email});
            } catch (error) {
                this.setState({loading: false, error: error});
                this.checkAndCallPropFunction('onPasswordResetFail', error);
            }
        }
    }

    /**
     * Second step of password recovery, checking the code to validate the user email
     * @param code
     * @param email
     * @returns {Promise<null>}
     */
    async requestPasswordValidateCode (code, email) {
        this.setState({loading: true, error: null});

        const requestedEmail = email || this.state.email;

        if (!requestedEmail) {
            // No email defined for recovery
            const error = this.mountError('error', 'Nenhum email foi definido para a validação do código');
            this.setState({loading: false, error: error});
            await this.checkAndCallPropFunction('onPasswordResetFail', error);
            return null;
        } else {
            // Check code to validate the email
            const apiUrl = this.props.validateCodeUrl || '/auth/validatecode';
            try {
                await Http.post(apiUrl, {email: requestedEmail, code: code});
                this.changeStep(3);
                this.setState({loading: false, email: requestedEmail, code: code});
            } catch (error) {
                this.setState({loading: false, error: error});
                this.checkAndCallPropFunction('onPasswordResetFail', error);
            }
        }
    }

    /**
     * Third step of password recovery, defining a new password for the user, with the validated code and email
     * @param newPassword
     * @param code
     * @param email
     * @returns {Promise<null>}
     */
    async resetPasswordWithCode (newPassword, code, email) {
        this.setState({loading: true, error: null});

        const requestedEmail = email || this.state.email;
        const providedCode = code || this.state.code;

        if (!requestedEmail) {
            // No email defined for recovery
            const error = this.mountError('error', 'Nenhum email foi definido para redefinição da senha');
            this.setState({loading: false, error: error});
            await this.checkAndCallPropFunction('onPasswordResetFail', error);
            return null;
        } else if (!providedCode) {
            // No email defined for recovery
            const error = this.mountError('error', 'Código não definido para redefinição de senha');
            this.setState({loading: false, error: error});
            await this.checkAndCallPropFunction('onPasswordResetFail', error);
            return null;
        } else {
            // Reset password for defined email
            const apiUrl = this.props.resetPasswordUrl || '/auth/passwordreset';
            try {
                await Http.post(apiUrl, {
                    email: requestedEmail,
                    code: providedCode,
                    password: newPassword
                });
                this.setState({loading: false, email: email});
                this.changeRoute('login');
                this.changeStep(1);
            } catch (error) {
                this.setState({loading: false, error: error});
                this.checkAndCallPropFunction('onPasswordResetFail', error);
            }
        }
    }

    /**
     * Return a error in App Masters pattern
     * @param key
     * @param message
     * @returns {{body: {}}}
     */
    mountError (key, message) {
        return {
            body: {
                [key]: message
            }
        };
    }

    /**
     * If a error is defined, try to find if it's an error of this field
     * @param field
     * @returns {*}
     */
    getFieldError (field) {
        return this.state.error && this.state.error.body && this.state.error.body[field];
    }

    /**
     * On route change, set state and run callback
     * @param route
     */
    changeRoute (route) {
        this.setState({route});
        this.checkAndCallPropFunction('onRouteChange', route);
    }

    /**
     * On password recover, change step number
     * @param step
     */
    changeStep (step) {
        this.setState({step});
        this.checkAndCallPropFunction('onStepChange', step);
    }

    /**
     * Props injection for each view type
     * @returns {{auth: (*)}}
     */
    mountProps () {
        const route = this.props.route || this.state.route;
        const authProps = {route}; // View props object

        // Default props for all views
        authProps.loading = this.state.loading;
        authProps.error = this.state.error;
        authProps.getFieldError = this.getFieldError;
        authProps.changeRoute = this.changeRoute;

        // Specific props for each view
        switch (route) {
        case 'login':
            authProps.doLogin = this.doLogin;
            authProps.doSocialLogin = this.doSocialLogin;
            break;
        case 'signUp':
            authProps.doSignUp = this.doSignUp;
            authProps.doSocialLogin = this.doSocialLogin;
            break;
        case 'recoverPassword':
            authProps.changeStep = this.changeStep;
            authProps.recoveryStep = this.state.step;
            authProps.requestCode = this.requestPasswordRequestCode;
            authProps.validateCode = this.requestPasswordValidateCode;
            authProps.resetPassword = this.resetPasswordWithCode;
            break;
        default:
            break;
        }
        return {auth: authProps, ...this.props.extra};
    }

    /**
     * Return correct view for each route
     * @returns {*}
     */
    getView () {
        const route = this.props.route || this.state.route;
        if (this.props[`${route}View`]) {
            return this.props[`${route}View`];
        } else {
            throw new Error(`View not defined for this route, please define a ${route}View`);
        }
    }

    render () {
        if (this.props.children) {
            // Children defined: clone element with new props
            return React.cloneElement(this.props.children, this.mountProps());
        } else {
            // Get view defined to defined route, creating element with new props
            return React.createElement(this.getView(), this.mountProps());
        }
    }
}

export default AuthContainer;
