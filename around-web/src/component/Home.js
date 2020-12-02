import React, {Component} from 'react';
import { Tabs, Button, Spin, Alert, Row, Col, Radio} from 'antd';

import { GEO_OPTIONS, POS_KEY, API_ROOT, AUTH_HEADER, TOKEN_KEY,
    POST_TYPE_IMAGE, POST_TYPE_VIDEO, POST_TYPE_UNKNOWN, TOPIC_AROUND, TOPIC_FACE } from '../constants'
import Gallery from "./Gallery";

import CreatePostButton from "./CreatePostButton";

import AroundMap from "./AroundMap";

const { TabPane } = Tabs;



class Home extends Component {
    state = {
        posts: [],
        err: '',
        isLoadingGeo: false,
        isLoadingPosts: false,
        topic: TOPIC_AROUND
    }

    render() {
        const operations = <CreatePostButton />;

        return (
            <div>
                <Radio.Group onChange={this.handleTopicChange} value={this.state.topic}>
                    <Radio value={TOPIC_AROUND}>Posts Around Me</Radio>
                    <Radio value={TOPIC_FACE}>Faces Around World</Radio>
                </Radio.Group>

                <Tabs tabBarExtraContent={operations}>
                    <TabPane tab="Image Posts" key="1">
                        {this.renderPosts(POST_TYPE_IMAGE)}
                    </TabPane>
                    <TabPane tab="Video Posts" key="2">
                        {this.renderPosts(POST_TYPE_VIDEO)}
                    </TabPane>
                    <TabPane tab="Map" key="3">
                        <AroundMap
                            googleMapURL="***"
                            loadingElement={<div style={{ height: `100%` }} />}
                            containerElement={<div style={{ height: `600px` }} />}
                            mapElement={<div style={{ height: `100%` }} />}
                            posts={this.state.posts}
                            loadPostsByTopic={this.loadPostsByTopic}
                        />
                    </TabPane>
                </Tabs>
            </div>
        );
    }


    handleTopicChange = (e) => {
        const topic = e.target.value;
        this.setState({ topic });
        if (topic === TOPIC_AROUND) {
            this.loadNearbyPosts();
        } else {
            this.loadFacesAroundTheWorld();
        }
    }

    loadFacesAroundTheWorld = () => {
        const token = localStorage.getItem(TOKEN_KEY);
        this.setState({ isLoadingPosts: true, error: '' });
        return fetch(`${API_ROOT}/cluster?term=face`, {
            method: 'GET',
            headers: {
                Authorization: `${AUTH_HEADER} ${token}`,
            }
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Failed to load posts');
            })
            .then((data) => {
                console.log(data);
                this.setState({ posts: data ? data : [], isLoadingPosts: false });
            })
            .catch((e) => {
                console.error(e);
                this.setState({ isLoadingPosts: false , error: e.message });
            });
    }

    componentDidMount() {
        if ("geolocation" in navigator) {
            this.setState({
                isLoadingGeo: true
            })
            navigator.geolocation.getCurrentPosition(
                this.onSuccessLoadGeoLocation,
                this.onFailedLoadGeoLocation,
                GEO_OPTIONS,
            )
        } else {
            this.setState({
                err: "fetch geolocation failed"
            })
        }
    }

    onSuccessLoadGeoLocation = (position) => {
        console.log(position)
        const {latitude, longitude} = position.coords
        localStorage.setItem(POS_KEY, JSON.stringify({lat: latitude, lon: longitude}))
        this.setState({
            isLoadingGeo: false,
            err: ''
        })
        this.loadNearbyPosts();
    }

    onFailedLoadGeoLocation = () => {
        console.log("err in location fetching")
    }

    loadNearbyPosts = (center, radius) => {
        const { lat, lon } = center ? center : JSON.parse(localStorage.getItem(POS_KEY));
        const range = radius ? radius : 20;
        const token = localStorage.getItem(TOKEN_KEY);

        this.setState({
            isLoadingPosts: true,
            err: ''
        })
        return fetch(`${API_ROOT}/search?lat=${lat}&lon=${lon}&range={range}`, // TODO: change lat lon
            {
                method: "GET",
                headers: {Authorization: `${AUTH_HEADER} ${token}`}
            })
            .then(response => {
                if(response.ok) {
                    return response.json()
                }
                throw new Error("fetch posts failed")
            })
            .then(data => {
                console.log(data)
                this.setState({
                    posts: data ? data : [],
                    isLoadingPosts: false
                })
            })
            .catch(err => {
                console.log("err in fetching posts", err)
                this.setState({
                    err: "fetch posts failed"
                })
            })
    }

    renderPosts = (type) => {
        const {posts, err, isLoadingGeo, isLoadingPosts} = this.state;
        if (err) {
            return err;
        } else if (isLoadingGeo) {
            return <Spin tip="Loading GEO location"/>
        } else if (isLoadingPosts) {
            return <Spin tip="Loading posts"/>
        } else if (posts.length > 0) {
            // const images = posts.map( post => {
            //     return {
            //         user: post.user,
            //         src: post.url,
            //         thumbnail: post.url,
            //         caption: post.message,
            //         thumbnailWidth: 400,
            //         thumbnailHeight: 300,
            //     }
            // })
            // return <Gallery images={images}/>
            return type === POST_TYPE_IMAGE ? this.renderImagePosts() : this.renderVideoPosts();
        } else {
            return 'No nearby posts';
        }
    }

    renderImagePosts = () => {
        const {posts} = this.state;
        const images  = posts.filter( post => post.type === POST_TYPE_IMAGE ).map(post => {
            return {
                user: post.user,
                src: post.url,
                thumbnail: post.url,
                caption: post.message,
                thumbnailWidth: 400,
                thumbnailHeight: 300,
            }
        })
        return <Gallery images={images} />
    }

    renderVideoPosts = () => {
        const {posts} = this.state;
        return (
            <Row gutter={30}>
                {
                    posts.filter(post =>
                        [POST_TYPE_UNKNOWN, POST_TYPE_VIDEO].includes(post.type)
                    ).map(post => {
                        return (
                            <Col key={post.url} span={6}>
                                <video src={post.url}
                                       controls={true}/>
                                <p>{post.user}: {post.message}</p>
                            </Col>
                        )
                    })
                }
            </Row>
        )
    }

    loadPostsByTopic = (center, radius) => {
        const {topic} = this.state;
        if (topic === TOPIC_AROUND) {
            return this.loadNearbyPosts(center, radius);
        } else {
            return this.loadFacesAroundTheWorld();
        }
    }
}

export default Home;