import Image from "next/image";

const bodyParts = [
  { name: "Head", front: "Head_Front.png", back: "Head_Back.png", style: "top-0 left-[30%]" },
  { name: "Chest", front: "chest.png", back: "chest.png", style: "top-[20px] left-[29%]" },
  { name: "Abdomen", front: "abdomen.png", back: "abdomen.png", style: "top-[35px] left-[30%]" },
  { name: "Shoulder", front: "shoulder_back.png", back: "shoulder_back.png", style: "top-[15px] left-[29%]" },
  { name: "Biceps", front: "bicep_front.png", back: "bicep_back.png", style: "top-[25px] left-[30%]" },
  { name: "Forearm", front: "forearm_front.png", back: "forearm_back.png", style: "top-[31px] left-[29.5%]" },
  { name: "Hands", front: "hand_front.png", back: "Hand_Back.png", style: "top-[47px] left-[30%]" },
  { name: "Thighs", front: "thigh_front.png", back: "thigh_back.png", style: "top-[68px] left-[29.8%]" },
  { name: "Shin", front: "shin_front.png", back: "shin_back.png", style: "top-[90px] left-[30.5%]" },
  { name: "Feet", front: "feet_front.png", back: "feet_back.png", style: "top-[112px] left-[31.4%]" },
  { name: "Neck", front: "neck_front.png", back: "Neck_Back.png", style: "top-[5px] left-[30%]" },
  { name: "Lower Body", front: "lower_front.png", back: "lower_back.png", style: "top-[52px] left-[30%]" },
];

export default function BodyDiagram() {
  return (
    <div className="flex justify-center items-center space-x-10 p-6 bg-gray-100">
      {/* FRONT VIEW */}
      <div className="relative w-[300px] h-[500px] bg-white shadow rounded">
        <Image
          src="/base_front.png"
          alt="Base Front"
          layout="fill"
          objectFit="contain"
          className="z-0"
        />
        {bodyParts.map((part, idx) => (
          <img
            key={idx}
            src={`/BODY_PARTS/${part.name}/${part.front}`}
            alt={part.name}
            className={`absolute z-10 w-[80px] ${part.style}`}
          />
        ))}
      </div>

      {/* BACK VIEW */}
      <div className="relative w-[300px] h-[500px] bg-white shadow rounded">
        <Image
          src="/base_back.png"
          alt="Base Back"
          layout="fill"
          objectFit="contain"
          className="z-0"
        />
        {bodyParts.map((part, idx) => (
          <img
            key={idx}
            src={`/BODY_PARTS/${part.name}/${part.back}`}
            alt={part.name}
            className={`absolute z-10 w-[80px] ${part.style}`}
          />
        ))}
      </div>
    </div>
  );
}
