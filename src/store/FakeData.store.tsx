import axios from "axios";
import { BehaviorSubject } from "rxjs";
import { generateRandomDOB, generateRandomSSN, getRandomBankDetails, getRandomName } from "../Utils/random";
import { FakeDataState } from "../types/types";
import { BaseModule } from "./BaseModule.store";
import { LocalStorage } from "@raycast/api";

export class FakeDataModule extends BaseModule {
  constructor() {
    super();
    this.loadFromLocalStorage(); // Charger les données depuis le LocalStorage au démarrage
  }

  private readonly fakeDataSubject = new BehaviorSubject<FakeDataState>({
    dob: null,
    name: null,
    ssn: null,
    bankDetails: null,
    address: null,
  });

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly addressLoadingSubject = new BehaviorSubject<boolean>(false);

  public fakeData$ = this.fakeDataSubject.asObservable();
  public isLoading$ = this.loadingSubject.asObservable();
  public isAddressLoading$ = this.addressLoadingSubject.asObservable();

  // Charger les données depuis le LocalStorage
  private async loadFromLocalStorage() {
    try {
      const dob = (await LocalStorage.getItem<string>("dob")) || null;
      const name = JSON.parse((await LocalStorage.getItem<string>("name")) || "null");
      const ssn = (await LocalStorage.getItem<string>("ssn")) || null;
      const bankDetails = JSON.parse((await LocalStorage.getItem<string>("bankDetails")) || "null");
      const address = (await LocalStorage.getItem<string>("address")) || null;

      this.fakeDataSubject.next({ dob, name, ssn, bankDetails, address });
    } catch (error) {
      console.error("[FakeDataModule] Error loading from LocalStorage:", error);
    }
  }

  // Sauvegarder les données dans le LocalStorage
  private async saveToLocalStorage(data: FakeDataState) {
    try {
      await LocalStorage.setItem("dob", data.dob || "");
      await LocalStorage.setItem("name", JSON.stringify(data.name || {}));
      await LocalStorage.setItem("ssn", data.ssn || "");
      await LocalStorage.setItem("bankDetails", JSON.stringify(data.bankDetails || {}));
      await LocalStorage.setItem("address", data.address || "");
    } catch (error) {
      console.error("[FakeDataModule] Error saving to LocalStorage:", error);
    }
  }

  // Fonction pour régénérer les données
  public async regenerateData(overrides?: Partial<FakeDataState>): Promise<void> {
    this.loadingSubject.next(true);

    try {
      const currentData = this.fakeDataSubject.getValue();
      const newDob = overrides?.dob || currentData?.dob || generateRandomDOB(false); // Priorité à l'override
      const isMinor = newDob ? new Date().getFullYear() - parseInt(newDob.split("/")[2], 10) < 18 : false;
      const newName = getRandomName();
      const newSSN = generateRandomSSN(newDob, newName.gender, isMinor);
      const newBankDetails = getRandomBankDetails();

      const updatedData: FakeDataState = {
        dob: newDob,
        name: newName,
        ssn: newSSN,
        bankDetails: newBankDetails,
        address: "Non générée", // Forcer la régénération de l'adresse
        ...overrides,
      };

      this.fakeDataSubject.next(updatedData);
      await this.saveToLocalStorage(updatedData); // Sauvegarder immédiatement dans le LocalStorage

      // Toujours régénérer une nouvelle adresse
      await this.fetchAddress();
    } catch (error) {
      console.error("[FakeDataModule] Error during data regeneration:", error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // Fonction pour mettre à jour partiellement les données
  public async updateFakeData(newData: Partial<FakeDataState>): Promise<void> {
    const currentData = this.fakeDataSubject.getValue();
    const updatedData = { ...currentData, ...newData };
    this.fakeDataSubject.next(updatedData);
    await this.saveToLocalStorage(updatedData); // Sauvegarder immédiatement les modifications
  }

  // Fonction pour récupérer une nouvelle adresse
  public async fetchAddress(maxRetries = 10): Promise<void> {
    this.addressLoadingSubject.next(true);
    let retries = 0;
    let fetchedAddress: string | null = null;

    while (!fetchedAddress && retries < maxRetries) {
      try {
        const query = this.getRandomSearchQuery();
        console.log(`[FakeDataModule] Attempt ${retries + 1}: Fetching address with query: ${query}`);

        const response = await axios.get(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
            query,
          )}&type=housenumber&autocomplete=1&limit=1`,
        );

        console.log("[FakeDataModule] Address API Response:", response.data);

        const feature = response.data.features?.[0];
        if (feature) {
          const { properties } = feature;
          fetchedAddress =
            properties.label ||
            `${properties.housenumber || ""} ${properties.street}, ${properties.postcode} ${properties.city}`.trim();

          console.log("[FakeDataModule] Parsed Address:", fetchedAddress);

          await this.updateFakeData({ address: fetchedAddress });
        } else {
          console.warn("[FakeDataModule] No valid address found.");
        }
      } catch (error) {
        console.error("[FakeDataModule] Error fetching address:", error);
      }

      retries++;
      if (!fetchedAddress && retries < maxRetries) {
        console.log(`[FakeDataModule] Retry ${retries}...`);
      }
    }

    if (!fetchedAddress) {
      console.error(`[FakeDataModule] Failed to fetch a valid address after ${maxRetries} retries`);
      await this.updateFakeData({ address: "Aucune adresse valide trouvée après plusieurs tentatives." });
    }

    this.addressLoadingSubject.next(false);
  }

  // Fonction pour générer une recherche aléatoire pour les adresses
  private getRandomSearchQuery(): string {
    const streetTypes = ["rue", "avenue", "boulevard", "place", "chemin"];
    const streetNames = ["de Paris", "de la République", "des Fleurs", "du Port", "Saint-Michel", "Victor Hugo"];
    const randomStreetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
    const randomStreetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const randomStreetNumber = Math.floor(Math.random() * 300) + 1;

    return `${randomStreetNumber} ${randomStreetType} ${randomStreetName}`;
  }
}
