import React, { Component } from 'react';
import { Alert, View, Platform, KeyboardAvoidingView, StyleSheet, LogBox } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo';

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
      isConnected: false,
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

    // check of user is online/offline
    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        this.setState({ isConnected: true });

        //Load messages from firebase
        this.referenceChatMessages = firebase
          .firestore()
          .collection('messages');

       //User authentication though firebase
        this.authUnsubscribe = firebase
          .auth()
          .onAuthStateChanged(async (user) => {
            if (!user) {
              await firebase.auth().signInAnonymously();
            }
            // Update user state
            this.setState({
              uid: user.uid,
              user: {
                _id: user.uid,
                name: name,
                avatar: 'https://placeimg.com/140/140/any',
              },
              messages: [],
            });
            // Lists for collection changes of current user
            this.unsubscribeChatUser = this.referenceChatMessages
              .orderBy('createdAt', 'desc')
              .onSnapshot(this.onCollectionUpdate);
          });
      } else {
        this.setState({ isConnected: false });
        this.getMessages();
        Alert.alert(
          'You are not connected to the internet!'
        );
      }
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

  //client side getMessages from storage
  getMessages = async () => {
    let messages = '';
    try {
      messages = (await AsyncStorage.getItem('messages')) || [];
      this.setState({ messages: JSON.parse(messages) });
    } catch (error) {
      console.log(error.message);
    }
  };

  //client side storage 
  saveMessages = async () => {
    try {
      await AsyncStorage.setItem(
        'messages',
        JSON.stringify(this.state.messages)
      );
    } catch (error) {
      console.log(error.message);
    }
  };

  // Add messages to client-side
  getMessages = async () => {
    let messages = '';
    try {
      messages = (await AsyncStorage.getItem('messages')) || [];
      this.setState({ messages: JSON.parse(messages) });
    } catch (error) {
      console.log(error.message);
    }
  };

  // Save messages from storage
  saveMessages = async () => {
    try {
      await AsyncStorage.setItem(
        'messages',
        JSON.stringify(this.state.messages)
      );
    } catch (error) {
      console.log(error.message);
    }
  };

  // Delete messages from storage
  deleteMessages = async () => {
    try {
      await AsyncStorage.removeItem('messages');
    } catch (error) {
      console.log(error.message);
    }
  };
 //adds message to firebase
  addMessage() {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      _id: message._id,
      uid: this.state.uid,
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
        this.saveMessages
      }
    );
  }

  //only render InputToolbar when the user is online
  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
    } else {
      return(
        <InputToolbar
        {...props}
        />
      );
    }
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