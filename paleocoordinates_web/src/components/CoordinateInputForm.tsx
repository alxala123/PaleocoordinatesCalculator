import { FaPlay, FaLocationArrow } from 'react-icons/fa';

interface Props {
  inputLat: string;
  inputLng: string;
  onChangeLat: (val: string) => void;
  onChangeLng: (val: string) => void;
  onSubmit: () => void;
  onUseCurrentLocation: () => void;
  loading: boolean;
  error: string | null;
}

const CoordinateInputForm = ({
  inputLat,
  inputLng,
  onChangeLat,
  onChangeLng,
  onSubmit,
  onUseCurrentLocation,
  loading,
  error,
}: Props) => (
  <div className="bg-white bg-opacity-90 p-6 rounded shadow-lg flex flex-col gap-4 max-w-md w-full mx-auto mt-8">
    <input
      type="number"
      placeholder="Latitude"
      value={inputLat}
      onChange={(e) => onChangeLat(e.target.value)}
      className="p-2 border rounded"
    />
    <input
      type="number"
      placeholder="Longitude"
      value={inputLng}
      onChange={(e) => onChangeLng(e.target.value)}
      className="p-2 border rounded"
    />
    <button
      onClick={onSubmit}
      disabled={loading}
      className="bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 transition"
    >
      {loading ? 'Processing...' : <><FaPlay /> Calculate</>}
    </button>
    <button
      onClick={onUseCurrentLocation}
      className="bg-gray-200 text-gray-800 py-2 rounded flex items-center justify-center gap-2 hover:bg-gray-300 transition"
    >
      <FaLocationArrow /> Use My Location
    </button>
    {error && <p className="text-red-600">{error}</p>}
  </div>
);

export default CoordinateInputForm;
