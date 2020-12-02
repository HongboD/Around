import React, {Component} from 'react';
import RegistrationForm from './Register';
import './Main.css';
import {Switch, Route, Redirect} from "react-router-dom";

export class Main extends Component {
    render() {
        return (
            <div className="main">
                <Switch>
                    <Route path="/login" render={this.getLogin}/>
                    <Route path="/register" component={RegistrationForm}/>
                    <Route path="/home" render={this.getHome}/>

                    <Route render={this.getLogin}/>
                </Switch>
            </div>
        )
    }

    getLogin = () => {
        return this.props.isLoggedIn ?
            <Redirect to="/home"/> : <Login handleLoginSucceed={this.props.handleLoginSucceed}/>
    }

    getHome = () => {
        return this.props.isLoggedIn ?
            <Home /> : <Redirect to="/login"/>
    }
}