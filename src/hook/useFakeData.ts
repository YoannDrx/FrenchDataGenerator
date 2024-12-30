import { useState, useEffect } from "react";
import { LocalStorage } from "@raycast/api";
import { generateRandomDOB, generateRandomSSN, getRandomBankDetails, getRandomName } from "../Utils/random";
import { BankDetails, FakeDataState, PersonName } from "../types/types";
import { useRandomAddress } from "./useRandomAdress";

export function useFakeData() {
  const [fakeData, setFakeData] = useState<FakeDataState>({
    dob: null,
    name: null,
    ssn: null,
    bankDetails: null,
    address: null,
  });
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { address: fetchedAddress, isLoading, fetchAddressWithRetry } = useRandomAddress();

  // Charger les données sauvegardées ou régénérer si elles n'existent pas
  useEffect(() => {
    const loadData = async () => {
      console.log("[useFakeData] Loading saved data from LocalStorage...");

      const savedDob = await LocalStorage.getItem<string>("dob");
      const savedName = await LocalStorage.getItem<string>("name");
      const savedSSN = await LocalStorage.getItem<string>("ssn");
      const savedBankDetails = await LocalStorage.getItem<string>("bankDetails");
      const savedAddress = await LocalStorage.getItem<string>("address");

      console.log("[useFakeData] Loaded data:", { savedDob, savedName, savedSSN, savedBankDetails, savedAddress });

      if (savedDob && savedName && savedSSN && savedBankDetails && savedAddress) {
        setFakeData({
          dob: savedDob,
          name: JSON.parse(savedName) as PersonName,
          ssn: savedSSN,
          bankDetails: JSON.parse(savedBankDetails) as BankDetails,
          address: savedAddress,
        });
      } else {
        console.log("[useFakeData] No saved data found. Regenerating...");
        await regenerateData();
      }
      setIsInitialized(true);
    };

    if (!isInitialized) {
      loadData();
    }
  }, [isInitialized]);

  // Mettre à jour l'adresse si une nouvelle adresse est récupérée
  useEffect(() => {
    console.log("[useFakeData] Checking if fetched address should update...");
    console.log("[useFakeData] Current fakeData.address:", fakeData.address);
    console.log("[useFakeData] Fetched address:", fetchedAddress);

    if (fakeData.address === "Non générée" && fetchedAddress) {
      console.log("[useFakeData] Updating address in fake data:", fetchedAddress);
      const updatedData = { ...fakeData, address: fetchedAddress };
      setFakeData(updatedData);
      saveData(updatedData);
    }
  }, [fetchedAddress]);

  // Sauvegarder les données dans le LocalStorage
  const saveData = async (data: FakeDataState) => {
    console.log("[useFakeData] Saving data to LocalStorage:", data);

    const { dob, name, ssn, bankDetails, address } = data;
    if (!dob || !name || !ssn || !bankDetails || !address) {
      console.error("[useFakeData] Missing required fields, cannot save data.");
      return;
    }

    await LocalStorage.setItem("dob", dob);
    await LocalStorage.setItem("name", JSON.stringify(name));
    await LocalStorage.setItem("ssn", ssn);
    await LocalStorage.setItem("bankDetails", JSON.stringify(bankDetails));
    await LocalStorage.setItem("address", address);
    console.log("[useFakeData] Data saved successfully.");
  };

  // Régénérer toutes les données
  const regenerateData = async () => {
    console.log("[useFakeData] Regenerating fake data...");

    const newName = getRandomName();
    const newDob = generateRandomDOB(false);
    const newSSN = generateRandomSSN(undefined, newName.gender, false);
    const newBankDetails = getRandomBankDetails();

    const newData = {
      dob: newDob,
      name: newName,
      ssn: newSSN,
      bankDetails: newBankDetails,
      address: "Non générée", // L'adresse sera récupérée séparément
    };

    console.log("[useFakeData] Newly generated data (without address):", newData);

    setFakeData(newData);
    await saveData(newData);

    console.log("[useFakeData] Fetching new address...");
    await fetchAddressWithRetry();
  };

  return { fakeData, isLoading, regenerateData, setFakeData, saveData, fetchAddressWithRetry };
}
