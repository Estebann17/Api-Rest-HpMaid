const User = require("../models/user");
const Card = require("../models/card");

async function getUserRanking(email) {
    try {
      // Obtener todos los usuarios
      const users = await User.find();
  
      // Array para almacenar la información de cada usuario con sus puntos totales
      const usersRank = [];
  
      // Iterar sobre cada usuario
      for (const user of users) {
        // Obtener todas las cartas que pertenecen al usuario
        const userCards = await Card.find({ "user.id": user._id });
  
        // Inicializar el objeto para contar la cantidad de cartas por rareza
        const cardCountsByRarity = {
          Comun: 0,
          Plata: 0,
          Oro: 0,
          Raro: 0,
          epico: 0,
          Mitico: 0,
        };
  
        // Calcular la cantidad de cartas por rareza y los puntos totales
        let totalPoints = 0;
        userCards.forEach((card) => {
          const rarity = card.content.rareza;
          switch (rarity) {
            case "Comun":
              cardCountsByRarity.Comun++;
              totalPoints += 1;
              break;
            case "Plata":
              cardCountsByRarity.Plata++;
              totalPoints += 2;
              break;
            case "Oro":
              cardCountsByRarity.Oro++;
              totalPoints += 4;
              break;
            case "Raro":
              cardCountsByRarity.Raro++;
              totalPoints += 6;
              break;
            case "epico":
              cardCountsByRarity.epico++;
              totalPoints += 10;
              break;
            case "Mitico":
              cardCountsByRarity.Mitico++;
              totalPoints += 14;
              break;
            default:
              break;
          }
        });
  
        // Obtener el total de cartas del usuario
        const totalCards = userCards.length;
  
        // Agregar la información del usuario al array
        usersRank.push({ user, totalPoints, totalCards });
      }
  
      // Ordenar el array de usuarios según los puntos totales de mayor a menor
      usersRank.sort((a, b) => b.totalPoints - a.totalPoints);
  
      // Encontrar el índice del usuario actual en el ranking
      const userIndex = usersRank.findIndex((u) => u.user.email === email);
  
      // Si el usuario no está en el ranking, devolver -1
      if (userIndex === -1) return -1;
  
      // Devolver el índice del usuario contando de arriba hacia abajo, sumando 1 para obtener el valor correcto
      return userIndex + 1;
    } catch (error) {
      console.error("Error al obtener el ranking de usuarios:", error);
      throw error; // Propagar el error para manejarlo fuera de la función si es necesario
    }
  }

  module.exports = { getUserRanking };