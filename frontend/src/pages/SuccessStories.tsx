import React from "react";
import { Heart, Calendar, MapPin, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDisplayDateTime } from "@/utils/dateUtils";

interface SuccessStory {
  id: string;
  petName: string;
  petType: string;
  petImage: string;
  shelterName: string;
  adopterName: string;
  story: string;
  adoptionDate: string;
  location: string;
  likes: number;
}

const SuccessStories: React.FC = () => {
  // Mock data - In a real app, this would come from an API
  const stories: SuccessStory[] = [
    {
      id: "1",
      petName: "Luna",
      petType: "Cat",
      petImage:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      shelterName: "Happy Tails Shelter",
      adopterName: "Sarah & John",
      story:
        "Luna was found as a stray kitten, malnourished and scared. After months of care and love at our shelter, she found her forever home with Sarah and John. Now she's the queen of their household, bringing joy and laughter every day.",
      adoptionDate: "2024-01-15",
      location: "New York, NY",
      likes: 245,
    },
    {
      id: "2",
      petName: "Max",
      petType: "Dog",
      petImage:
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      shelterName: "Paws & Hearts Rescue",
      adopterName: "Michael",
      story:
        "Max was surrendered to our shelter due to his owner's health issues. Despite being an older dog, he found a perfect match with Michael, who was looking for a calm companion. They now enjoy daily walks and quiet evenings together.",
      adoptionDate: "2024-02-01",
      location: "Los Angeles, CA",
      likes: 189,
    },
    {
      id: "3",
      petName: "Bella",
      petType: "Dog",
      petImage:
        "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      shelterName: "Furever Home Rescue",
      adopterName: "The Thompson Family",
      story:
        "Bella was rescued from a puppy mill and needed extensive medical care. The Thompson family saw her potential and provided the love and care she needed. Now she's thriving in her new home with their two children.",
      adoptionDate: "2024-01-20",
      location: "Chicago, IL",
      likes: 312,
    },
  ];

  const formatDate = (dateString: string) => {
    return formatDisplayDateTime(new Date(dateString));
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <div className="flex justify-center mb-4">
          <Heart className="w-12 h-12 text-primary-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Success Stories</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Heartwarming stories of pets finding their forever homes and the
          wonderful families who adopted them
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {stories.map((story) => (
          <div
            key={story.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="md:flex">
              <div className="md:w-1/3">
                <img
                  src={story.petImage}
                  alt={story.petName}
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <div className="p-6 md:w-2/3">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {story.petName}'s Story
                    </h2>
                    <p className="text-gray-600">{story.petType}</p>
                  </div>
                  <button
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    aria-label="Share story"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-gray-700 mb-6">{story.story}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Adopted on {formatDate(story.adoptionDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{story.location}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">
                      Adopted by{" "}
                      <span className="font-medium">{story.adopterName}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      From{" "}
                      <span className="font-medium">{story.shelterName}</span>
                    </p>
                  </div>
                  <button
                    className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors"
                    aria-label="Like story"
                  >
                    <Heart className="w-5 h-5" />
                    <span>{story.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Share Your Success Story</h2>
        <p className="text-gray-600 mb-6">
          Have a heartwarming adoption story to share? We'd love to hear about
          it!
        </p>
        <Link
          to="/shelter/dashboard"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Submit Your Story
        </Link>
      </div>
    </div>
  );
};

export default SuccessStories;
