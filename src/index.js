import React, {Component} from 'react';
import {Http} from '@app-masters/js-lib';

class AuthContainer extends Component {
    constructor (props) {
        super(props);
        this.checkProps(props);
        this.state = {
            route: this.props.route || 'redirect',
            auth: null,
            loading: false,
            error: null
        };
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
    checkProps (props) {
        return true;
    }

    /**
     * Return correct view for each route. If a children is defined, return children
     * @returns {*}
     */
    getView () {
        const {route} = this.props.route || this.state.route;
        if (this.props.children) {
            return this.props.children;
        } else if (this[`${route}View`]) {
            return this[`${route}View`];
        } else if (this.props[`${route}View`]) {
            return this.props[`${route}View`];
        } else {
            throw new Error('View not defined for this route');
        }
    }

    /**
     * Check if auth object is defined, if it's not, redirect to singUp
     */
    checkAndRedirect () {
        if (this.state.auth) {
            this.checkAndCallPropFunction('onUserAuthenticated', this.state.auth);
        } else {
            this.changeRoute(this.props.routeAfterCheck || 'signUp');
        }
    }

    /**
     * On route change, set state and run callback
     * @param route
     */
    changeRoute (route) {
        this.setState({route});
        this.checkAndCallPropFunction('onRouteChange', route);
    }

    async doLogin (userObject) {
        this.setState({loading: true, error: null});

        // Validate body
        const errorObject = this.props.validateUser(userObject, this.state.route);

        if (errorObject) {
            // Body is not a valid object
            this.setState({loading: false, error: errorObject});
            this.checkAndCallPropFunction('onLoginFailed', errorObject);
            return null;
        } else {
            // Login user
            const loginUrl = this.props.loginUrl || '/auth/login';
            try {
                const response = await Http.post(loginUrl, userObject);
                this.checkAndCallPropFunction('onLoginSuccess', response);
                this.checkAndCallPropFunction('onUserAuthenticated', response);
            } catch (error) {
                this.setState({loading: false, error: error});
                this.checkAndCallPropFunction('onLoginFailed', error);
            }
        }
    }

    async doSocialLogin (userObject, network) {
        this.setState({loading: true, error: null});

        // Validate body
        const errorObject = this.props.validateUser(userObject, network);

        if (errorObject) {
            // Body is not a valid object
            this.setState({loading: false, error: errorObject});
            this.checkAndCallPropFunction('onSocialLoginFailed', errorObject);
            return null;
        } else {
            // Login user
            const socialLoginUrl = this.props.socialLoginUrl || '/auth/loginsocial';
            try {
                const response = await Http.post(socialLoginUrl, { network, ...userObject });
                this.checkAndCallPropFunction('onSocialLoginSuccess', response);
                this.checkAndCallPropFunction('onUserAuthenticated', response);
            } catch (error) {
                this.setState({loading: false, error: error});
                this.checkAndCallPropFunction('onSocialLoginFailed', error);
            }
        }
    }

    async doSignUp (userObject) {
        this.setState({loading: true, error: null});

        // Validate body
        const errorObject = this.props.validateUser(userObject, this.state.route);

        if (errorObject) {
            // Body is not a valid object
            this.setState({loading: false, error: errorObject});
            this.checkAndCallPropFunction('onSingUpFailed', errorObject);
            return null;
        } else {
            // Login user
            const signUpUrl = this.props.signUpUrl || '/auth/signup';
            try {
                const response = await Http.post(signUpUrl, userObject);
                this.checkAndCallPropFunction('onSingUpSuccess', response);
                this.checkAndCallPropFunction('onUserAuthenticated', response);
            } catch (error) {
                this.setState({loading: false, error: error});
                this.checkAndCallPropFunction('onSingUpFailed', error);
            }
        }
    }

    /**
     * Check if optional callback function is defined
     * @param functionName
     * @param parameter
     */
    checkAndCallPropFunction (functionName, ...parameters) {
        if (this.props[functionName] && (typeof this.props[functionName]) === 'function') {
            this.props[functionName](...parameters);
        }
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
        default:
            break;
        }

        return {auth: authProps};
    }

    render () {
        return React.cloneElement(this.getView(), this.mountProps());
    }
}

export default AuthContainer;
