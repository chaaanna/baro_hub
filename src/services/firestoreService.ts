
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { VideoAnalysisResult } from "../../types"; // Corrected path from ../types to ../../types

const HISTORY_COLLECTION = "analysis_history";

// The data structure for items in the history
export interface AnalysisHistoryItem extends VideoAnalysisResult {
  id: string; // Firestore document ID
  source: string; // URL or filename
  title: string;
  analyzedAt: Timestamp; // Use Firestore Timestamp for proper ordering
}

/**
 * Adds a new video analysis result to the Firestore database.
 * @param analysisData - The analysis result data, without the Firestore ID.
 */
export const addAnalysisToHistory = async (analysisData: Omit<AnalysisHistoryItem, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, HISTORY_COLLECTION), analysisData);
    console.log("Document written with ID: ", docRef.id);
    return docRef;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error("Failed to save analysis to the database.");
  }
};

/**
 * Listens for real-time updates to the analysis history collection.
 * @param callback - A function that will be called with the updated history list.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const onHistoryUpdate = (callback: (history: AnalysisHistoryItem[]) => void) => {
  const q = query(collection(db, HISTORY_COLLECTION), orderBy("analyzedAt", "desc"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const history: AnalysisHistoryItem[] = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() } as AnalysisHistoryItem);
    });
    callback(history);
  }, (error) => {
    console.error("Error fetching history: ", error);
    // You might want to handle this error in the UI
  });

  return unsubscribe; // Return the function to detach the listener
};
