// src/components/LoadingSpinner.tsx
export default function LoadingSpinner() {
    return (
      <div className="flex justify-center items-center">
        <svg
          className="animate-spin h-10 w-10 text-[#6a11cb]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 100 16v-4L8.5 19.5 12 24v-4a8 8 0 01-8-8z"
          ></path>
        </svg>
      </div>
    );
  }
  