import { useState } from "react";
import axios from "axios";

export function useRandomAddress() {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAddressWithRetry = async (maxRetries = 5) => {
    let retries = 0;
    let fetchedAddress = null;

    setIsLoading(true);

    while (!fetchedAddress && retries < maxRetries) {
      const query = getRandomSearchQuery();
      console.log(`Attempt ${retries + 1}: Fetching address with query: ${query}`);

      try {
        const response = await axios.get(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
            query,
          )}&type=housenumber&autocomplete=1&limit=1`,
        );
        console.log("API Response (raw):", response.data);

        const feature = response.data.features?.[0];
        if (feature) {
          const { properties } = feature;
          fetchedAddress =
            properties.label ||
            `${properties.housenumber || ""} ${properties.street}, ${properties.postcode} ${properties.city}`.trim();
          console.log("Formatted address:", fetchedAddress);
          setAddress(fetchedAddress);
        } else {
          console.warn("No valid address found, retrying...");
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      }

      retries += 1;
    }

    if (!fetchedAddress) {
      console.error("Failed to fetch a valid address after retries");
      setAddress("Aucune adresse valide trouvée après plusieurs tentatives.");
    }

    setIsLoading(false);
  };

  return { address, isLoading, fetchAddressWithRetry };
}

function getRandomSearchQuery() {
  const streetTypes = ["rue", "avenue", "boulevard", "place", "chemin"];
  const streetNames = ["de Paris", "de la République", "des Fleurs", "du Port", "Saint-Michel", "Victor Hugo"];
  const randomStreetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
  const randomStreetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const randomStreetNumber = Math.floor(Math.random() * 300) + 1;

  return `${randomStreetNumber} ${randomStreetType} ${randomStreetName}`;
}
