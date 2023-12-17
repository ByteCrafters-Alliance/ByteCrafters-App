import React, { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { css } from '@emotion/react';
import { BarLoader } from 'react-spinners';
import './App.css';

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

const App = () => {
  const [totalVotes, setTotalVotes] = useState(0);
  const [connection, setConnection] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState('');

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5200/vote-hub')
      .build();

    setConnection(newConnection);

    newConnection.start()
      .then(() => {
        console.log('SignalR connected');

        fetch('http://localhost:5200/api/vote')
          .then(response => response.json())
          .then(data => setTotalVotes(data))
          .catch(error => console.error('Error fetching initial total votes:', error));
      })
      .catch(error => console.error('Error connecting to SignalR:', error));

    newConnection.on('ReceiveVoteUpdate', newTotalVotes => {
      setTotalVotes(newTotalVotes);
    });

    return () => {
      newConnection.stop();
    };
  }, []);

  const castVote = () => {
    if (isVoting) return;

    const candidate = 'candidate';

    setIsVoting(true);

    fetch(`http://localhost:5200/api/vote?candidate=${candidate}`, { method: 'POST' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to cast vote');
        }

        setVoteMessage('Vote cast successfully!');
      })
      .catch(error => {
        console.error(error);
        setVoteMessage('Failed to cast vote. Please try again.');
      })
      .finally(() => {
        setIsVoting(false);

        // Clear the feedback message after a short delay
        setTimeout(() => {
          setVoteMessage('');
        }, 5000);
      });
  };

  return (
    <div className="voting-app-container">
      <h1 className="app-title">Real-Time Voting App</h1>
      <p className="total-votes">Total Votes: {totalVotes}</p>
      <button
        className="vote-button"
        onClick={castVote}
        disabled={isVoting}
      >
        {isVoting ? 'Voting...' : 'Cast Vote'}
      </button>
      <div className="progress-bar-container">
        <BarLoader
          css={override}
          color={'#4CAF50'}
          loading={isVoting}
          height={4}
          width={150}
        />
      </div>
      {voteMessage && <p className="vote-message">{voteMessage}</p>}
    </div>
  );
};

export default App;
