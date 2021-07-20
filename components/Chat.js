import React, { Component } from 'react';
import { View, Platform, KeyboardAvoidingView, StyleSheet, LogBox } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';

// Google Firebase
const firebase = require('firebase');
require('firebase/firestore');

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      uid: 0,
      user: {
        _id: '',
        name: '',
        avatar: '',
      },
    };
  
// Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyCzyvdKPAlDjg4QQp4ZUr06yaX9nwpIha8",
    authDomain: "test-206d7.firebaseapp.com",
    projectId: "test-206d7",
    storageBucket: "test-206d7.appspot.com",
    messagingSenderId: "845780745425",
    appId: "1:845780745425:web:ee3f3fcf874aea531d59f0",
    measurementId: "G-1022MXMBW7"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  this.referenceChatMessages = firebase.firestore().collection('messages');

}

  // Sets state with a static message
  componentDidMount() {
    let { name } = this.props.route.params;

    this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        try {
          await firebase.auth().signInAnonymously();
        } catch (error) {
          console.error(error.message);
        }
      }

      // Update user state
      this.setState({
        user: {
          _id: user.uid,
          name: name,
          avatar: 'https://placeimg.com/140/140/any',
        },
        messages: [],
      });

      // Creates reference to active user's messages
      this.referenceChatMessages = firebase.firestore().collection('messages');
      // Lists for collection changes of current user
      this.unsubscribeChatUser = this.referenceChatMessages
        .orderBy('createdAt', 'desc')
        .onSnapshot(this.onCollectionUpdate);
    });
  }

  componentWillUnmount() {
    // Stops listening for authentication
    this.unsubscribeChatUser();
    // Stops listening for changes
    this.authUnsubscribe();
  }

  // Updates messages state
  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // Iterate through each document
    querySnapshot.forEach((doc) => {
      let data = doc.data(); // Grabs QueryDocumentSnapshot's data
      messages.push({
        _id: data._id,
        createdAt: data.createdAt.toDate(),
        text: data.text || null,
        user: data.user,
      });
    });
    this.setState({ messages });
  };

  // Add messages to database
  addMessage() {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      _id: message._id,
      createdAt: message.createdAt,
      text: message.text || null,
      user: message.user,
    });
  }

  // Event handler for when chat message is sent
  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.addMessage();
      }
    );
  }

  //modify the color of the chat bubble from the sender
  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#08d9d6',
          },
        }}
      />
    );
  }
  render() {
    const color = this.props.route.params.color; // Color user selected in Start.js
    const styles = StyleSheet.create({
      container: {
        backgroundColor: color,
        flex: 1,
      },
    });

    const { name } = this.props.route.params;
    const { messages } = this.state;

    return (
      <View style={styles.container}>
        <GiftedChat
          renderBubble={this.renderBubble}
          messages={messages}
          onSend={(messages) => this.onSend(messages)}
          user={{
            _id: this.state.uid,
            avatar: 'https://placeimg.com/140/140/any',
            name: name,
          }}
        />
        {/* Android keyboard fix */}
        {Platform.OS === 'android' ? (
          <KeyboardAvoidingView behavior='height' />
        ) : null}
      </View>
    );
  }
}

export default Chat;