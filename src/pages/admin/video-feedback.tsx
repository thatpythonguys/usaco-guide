import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
} from 'firebase/firestore';
import { Link } from 'gatsby';
import React, { ReactElement, useEffect, useState } from 'react';
import Layout from '../../components/layout';
import TopNavigationBar from '../../components/TopNavigationBar/TopNavigationBar';
import { SignInContext } from '../../context/SignInContext';
import UserDataContext from '../../context/UserDataContext/UserDataContext';
import { useFirebaseApp } from '../../hooks/useFirebase';

export default function VideoFeedbackPage(): ReactElement {
  const { firebaseUser, isLoaded } = React.useContext(UserDataContext);
  const { signIn } = React.useContext(SignInContext);
  const firebaseApp = useFirebaseApp();
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      if (!firebaseApp) return;
      const db = getFirestore(firebaseApp);
      const videosSnapshot = await getDocs(collection(db, 'videos'));
      const videos = [];
      videosSnapshot.forEach(doc => {
        videos.push(doc.id);
      });
      const newData = [];
      await Promise.all(
        videos.map(async v => {
          if (v == '__permissions') return;

          const videoComments = [];
          const [videoDataSnapshot, feedbackSnapshot] = await Promise.all([
            getDoc(doc(db, 'videos', v)),
            await getDocs(collection(db, 'videos', v, 'feedback')),
          ]);
          feedbackSnapshot.forEach(doc => {
            videoComments.push({
              rating: doc.data()?.rating || '',
              comments: doc.data()?.comments || [],
              author: doc.id,
            });
          });
          const [sumScores, numScores] = videoComments.reduce(
            ([sum, num], c) => {
              if (!c || !c.rating) return [sum, num];
              if (
                ['very bad', 'bad', 'good', 'great'].indexOf(c.rating) == -1
              ) {
                console.log('skipped unrecognized rating:', c);
                return [sum, num];
              }
              return [
                sum +
                  ['very bad', 'bad', 'good', 'great'].indexOf(c.rating) +
                  1,
                num + 1,
              ];
            },
            [0, 0]
          );

          newData.push({
            feedback: videoComments,
            avgScore:
              numScores === 0
                ? null
                : Math.round((sumScores / numScores) * 100) / 100,
            id: v,
            videoData: videoDataSnapshot.data(),
          });
        })
      ).then(() => {
        console.log(newData);
        setData(newData);
      });
    })();
  }, [firebaseApp]);
  if (isLoaded && !firebaseUser?.uid) {
    return (
      <Layout>
        <TopNavigationBar />
        <main className="text-center py-10">
          <p className="font-medium text-2xl">
            You need to sign in to access videos feedback.{' '}
            <button
              onClick={() => signIn()}
              className="focus:outline-none underline text-blue-600 dark:text-blue-300"
            >
              Sign in now
            </button>
          </p>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <TopNavigationBar />
      <main className="text-center py-10">
        <p className="font-medium text-2xl">
          Check the console for data.
          {/*You do not have permission to view this page.*/}
          <Link
            to="/groups"
            className="text-blue-600 dark:text-blue-400 underline"
          >
            Return Home.
          </Link>
        </p>
      </main>
    </Layout>
  );
}
