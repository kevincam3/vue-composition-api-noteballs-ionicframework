/*
  pinia import that we need to do to be able to make this file a pina store
 */
import { defineStore } from "pinia";

/*
  Firebase imports
 */
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  CollectionReference,
  Query,
} from "firebase/firestore";
import { db } from "@/js/firebase";
import { useAuthStore } from "@/stores/AuthStore";

/*
  Here we are using a typescript feature called "type aliasing" https://www.typescriptlang.org/docs/handbook/namespaces.html#aliases
  Note this is not a normal import statement, it is a type aliasing statement to help import a type included in a namespace.
  Here we're importing the Note type from the Note type file. This is the type that we will use to define the notes in the store
  Types here is the namespace we created in the Note type file
 */
import Note = Types.Note;

// Here we are importing the "Unsubscribe" type from the firebase library so that we can define the type returned by the onSnapshot function.
import { Unsubscribe } from "@firebase/firestore";

let notesCollectionRef: CollectionReference;
let notesCollectionQuery: Query;
let getNotesSnapshot: Unsubscribe | null = null;

/*
  Notes
  This variable is used to store all the notes. Each one is of type note which is defined in the types folder and imported above.
  For this reason, the notes variable is define as an array of type Note with its initial value being an empty array.
  We could have defined this directly in the state function below, but we are defining it here so that we can better provide its type
  instead of using the typescript "as" operator directly on the array e.g. notes: [] as Array<Note>.
 */
const notes: Array<Note> = [];

/*
  State Property
  The state property is a function that returns an object.
  We are using an arrow function here to avoid the need to use the return keyword.
  With arrow functions we don't need the return keyword or the parentheses if we only have one line of code.
  However if what we are returning starts with a parenthesis, as is the case when returning an object literal, we need to wrap the whole thing in parentheses.
  If we don't do this, the compiler will think we are starting a function body.
  For this reason, we need to wrap the object literal in parentheses.
  We can also define a state object outside of the state function and return it.
*/
export const useNotesStore = defineStore("NotesStore", {
  state: () => ({
    notes,
    notesLoaded: false,
  }),
  actions: {
    init() {
      const authStore = useAuthStore();

      // This was done to DRY (Don't Repeat Yourself) up the code since in Firebase we access the collection multiple times
      // The collection is basically the table in a database, just in a NoSQL database like Firebase it's called a collection
      notesCollectionRef = collection(db, "users", authStore.user.id, "notes");

      // This is the firebase query. Here we're getting all the documents/rows in a collection/table.
      // We're using the orderBy function to sort the documents by the date field in descending order
      notesCollectionQuery = query(notesCollectionRef, orderBy("date", "desc"));

      // initialise our database refs
      this.getNotes();
    },
    async getNotes() {
      // this variable is to control the loading state of the notes. So when the notes are not loaded, we show a loading spinner
      this.notesLoaded = false;

      // This is the firebase onSnapshot function. It's a listener that will listen for any changes to the database and update the notes array accordingly
      // We are assigning the unsubscribe function to a variable so that we can call it when the user logs out so that we don't have multiple listeners running
      // If we don't unsubscribe then when another user logs in and adds a note it will display the notes from the previous user that was logged in.
      getNotesSnapshot = onSnapshot(
        notesCollectionQuery,
        (querySnapshot) => {
          // We created this local array variable to store the notes we get from firebase.
          const notes: Array<Note> = [];
          querySnapshot.forEach((doc) => {
            let note: Note = {
              id: doc.id,
              date: doc.data().date,
              content: doc.data().content,
            };
            notes.push(note);
          });

          // Here we are using the state property, notes, to set its value to the notes we got from firebase. Essentially, we are overwriting the state's notes array with the one we generated from Firebase.
          this.notes = notes;
          this.notesLoaded = true;
        },
        (error) => {
          console.log("error.message", error.message);
        }
      );
    },
    async addNote(newNoteContent: string) {
      let date = new Date().getTime().toString();

      //add the note to the list of existing notes
      await addDoc(notesCollectionRef, {
        content: newNoteContent,
        date,
      });
    },
    async deleteNote(idToDelete: string) {
      await deleteDoc(doc(notesCollectionRef, idToDelete));
    },
    async updateNote(id: string, content: string) {
      await updateDoc(doc(notesCollectionRef, id), {
        content,
      });
    },
    clearNotes() {
      this.notes = [];

      // Here we are checking if there is already a snapshot listener on the notes collection and if there is then we unsubscribe from it. This is to prevent multiple listeners on the same collection
      if (getNotesSnapshot) getNotesSnapshot();
    },
  },
  getters: {
    getNoteContent: (state) => (id: string) => state.notes.filter((note) => note.id === id)[0].content,
    totalNotesCount: (state) => state.notes.length,
    totalCharactersCount: (state) => {
      let count = 0;
      state.notes.forEach((note) => (count += note.content.length));
      return count;
    },
  },
});
