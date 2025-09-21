import { useEffect, useState, useRef } from 'react';
import axios from '../axios';
import { FaCommentDots } from 'react-icons/fa';

export default function CannedResponsePopover({ onSelectResponse }) {
  const [isOpen, setIsOpen] = useState(false);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const fetchResponses = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          const res = await axios.get('/canned-responses');
          setResponses(res.data?.data || []);
        } catch (error) {
          console.error("Failed to fetch canned responses", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchResponses();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (text) => {
    onSelectResponse(text);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700"
        title="Canned Responses"
      >
        <FaCommentDots size={20} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-2 font-bold border-b">الردود المحفوظة</div>
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">جاري التحميل...</div>
            ) : responses.length > 0 ? (
              <ul>
                {responses.map((res) => (
                  <li
                    key={res._id}
                    onClick={() => handleSelect(res.text)}
                    className="p-3 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    <p className="font-bold">{res.title}</p>
                    <p className="text-gray-600 truncate">{res.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">لا توجد ردود محفوظة.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}