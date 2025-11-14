// Utilitaire de stockage local utilisant localStorage
// Simule l'API window.storage utilisée dans VotingPlatform

const storage = {
  async get(key, useLocalStorage = false) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) {
        return null;
      }
      return { value };
    } catch (error) {
      console.error('Erreur lors de la lecture du stockage:', error);
      return null;
    }
  },

  async set(key, value, useLocalStorage = false) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'écriture dans le stockage:', error);
      return false;
    }
  },

  async remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du stockage:', error);
      return false;
    }
  },

  async clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage du stockage:', error);
      return false;
    }
  }
};

// Expose storage sur window pour être accessible globalement
if (typeof window !== 'undefined') {
  window.storage = storage;
}

export default storage;


