<script setup lang="ts">
/*
  imports
 */
import { onClickOutside } from "@vueuse/core";
import { onMounted, onUnmounted, ref } from "vue";
import { useNotesStore } from "@/stores/NotesStore";
/*
  props
 */
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  noteId: {
    type: String,
    required: true,
  },
});

/*
  emits
 */
const emit = defineEmits(["update:modelValue"]);

/*
  store
 */
const notesStore = useNotesStore();

/*
  close modal
 */
const closeModal = () => emit("update:modelValue", false);

/*
  click outside to close
 */
const modalCardRef = ref(null);
onClickOutside(modalCardRef, closeModal);

/*
  keyboard control
 */
const handleKeyboard = (e: KeyboardEvent) => {
  if (e.key === "Escape") closeModal();
};
onMounted(() => {
  document.addEventListener("keyup", handleKeyboard);
});

onUnmounted(() => {
  document.removeEventListener("keyup", handleKeyboard);
});
</script>
<template>
  <div class="modal is-active p-2">
    <div class="modal-background"></div>
    <div
      ref="modalCardRef"
      class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Delete Note?</p>
        <button
          @click="closeModal"
          class="delete"
          aria-label="close"></button>
      </header>
      <section class="modal-card-body">Are you sure you want to delete this note?</section>
      <footer class="modal-card-foot is-justify-content-flex-end">
        <button
          class="button"
          @click="closeModal">
          Cancel
        </button>
        <button
          class="button is-danger"
          @click="notesStore.deleteNote(props.noteId)">
          Delete
        </button>
      </footer>
    </div>
  </div>
</template>
