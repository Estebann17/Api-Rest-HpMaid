//actualizar controladores para cartas

const Card = require("../models/card");
const User = require("../models/user");
const AniList = require("anilist-node");
const Anilist = new AniList();
const axios = require("axios");
const ApiCards = require("../models/apiCards");

async function getMonedasYRarezaCard(mal_id) {
  try {
    if (!mal_id) throw new Error("mal_id no proporcionado");

    const carta = await ApiCards.findOne({ mal_id });
    if (!carta) throw new Error("Carta no encontrada");

    return {
      monedas: carta.monedas,
      rareza: carta.rareza || "comun",
    };
  } catch (error) {
    console.error("Error en getMonedasYRarezaCard:", error);
    throw new Error("Error al obtener los datos para la carta");
  }
}

async function getMonedasCard(mal_id) {
  try {
    // Verifica si mal_id es válido
    if (!mal_id) {
      throw new Error("mal_id no proporcionado");
    }

    // Buscar la carta en la base de datos por su mal_id
    const carta = await ApiCards.findOne({ mal_id });

    // Verificar si la carta existe
    if (!carta) {
      throw new Error("Carta no encontrada");
    }

    // Devolver el valor de .monedas de la carta
    const monedas = carta.monedas;

    return monedas;
  } catch (error) {
    console.error("Error en getMonedasCard:", error);
    throw new Error("Error al obtener las monedas para la carta");
  }
}

async function getRarezaCard(mal_id) {
  try {
    // Verifica si mal_id es válido
    if (!mal_id) {
      throw new Error("mal_id no proporcionado");
    }

    // Buscar la carta en la base de datos por su mal_id
    const carta = await ApiCards.findOne({ mal_id });

    // Verificar si la carta existe
    if (!carta) {
      throw new Error("Carta no encontrada");
    }

    // Devolver la rareza de la carta
    const rareza = carta.rareza || "comun"; // Si no hay rareza, se establece como "comun"

    return rareza;
  } catch (error) {
    console.error("Error en getRarezaCard:", error);
    throw new Error("Error al obtener la rareza para la carta");
  }
}

const cardController = {
  async saveCard(req, res) {
    try {
      const { email, content } = req.body;

      // Verifica si el email y el contenido de la carta se proporcionan
      if (!email || !content) {
        return res.status(400).json({
          error:
            "Se requiere proporcionar un email y contenido para guardar la carta.",
        });
      }

      // Busca al usuario por su email en la base de datos
      const user = await User.findOne({ email });

      // Verifica si se encontró un usuario con el email proporcionado
      if (!user) {
        return res.status(404).json({
          error: "No se encontró un usuario con el email proporcionado.",
        });
      }

      const existingCard = await Card.findOne({
        "content.mal_id": content.mal_id,
        "user.id": user._id,
      });

      if (existingCard) {
        const coinsEarned = content.monedas || 0;
        user.coins += coinsEarned;
        await user.save();
        return res.status(202).json({
          status: 202,
          message: "La carta ya existe, se han ganado monedas.",
          coinsEarned,
          newCoinsValue: coinsEarned,
        });
      }

      // Crea una nueva carta y asigna el ID del usuario
      const newCard = new Card({
        mal_id: content.mal_id,
        user: {
          id: user._id,
          email: user.email,
        },
        content,
      });

      // Guarda la nueva carta en la base de datos
      const savedCard = await newCard.save();

      // Actualiza el array 'cards' del usuario con el ID de la nueva carta
      user.cards.push(savedCard._id);
      await user.save();

      res.status(201).json(savedCard);
    } catch (error) {
      console.error("Error en saveCard:", error);
      res
        .status(500)
        .json({ error: "Error interno del servidor al guardar la carta." });
    }
  },

  async findUserCards(req, res) {
    try {
      const { email } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!email) {
        return res.status(400).json({
          error: "Se requiere proporcionar un email para buscar las cartas.",
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          error: "No se encontró un usuario con el email proporcionado.",
        });
      }

      const skip = (page - 1) * limit;
      const userCards = await Card.find({ _id: { $in: user.cards } })
        .skip(skip)
        .limit(parseInt(limit));

      if (!userCards || userCards.length === 0) {
        return res.status(200).json([""]);
      }

      const updates = userCards.map(async (userCard) => {
        const { monedas, rareza } = await getMonedasYRarezaCard(
          userCard.mal_id
        );
        userCard.content.monedas = monedas;
        userCard.content.rareza = rareza;
        await userCard.save();
        return userCard;
      });

      const updatedCards = await Promise.all(updates);

      res.status(200).json(updatedCards);
    } catch (error) {
      console.error("Error en findUserCards:", error);
      res
        .status(500)
        .json({ error: "Error interno del servidor al buscar las cartas." });
    }
  },
  async findUserCardsById(req, res) {
    try {
      const { userId } = req.params; // Obtener el ID del usuario de los parámetros en lugar del cuerpo
      const { page = 1, limit = 10 } = req.query; // Obtener la página y el límite de los parámetros de consulta

      // Verifica si el ID del usuario se proporciona
      if (!userId) {
        return res.status(400).json({
          error:
            "Se requiere proporcionar un ID de usuario para buscar las cartas.",
        });
      }

      // Busca al usuario por su ID en la base de datos
      const user = await User.findById(userId);

      // Verifica si se encontró un usuario con el ID proporcionado
      if (!user) {
        return res.status(404).json({
          error: "No se encontró un usuario con el ID proporcionado.",
        });
      }

      const skip = (page - 1) * limit;

      // Busca todas las cartas asociadas al usuario con paginación
      const userCards = await Card.find({ _id: { $in: user.cards } })
        .skip(skip)
        .limit(parseInt(limit));

      if (!userCards || userCards.length === 0) {
        return res.status(200).json([""]);
      }

      // Para cada carta, obtén las monedas y la rareza y actualiza los campos correspondientes
      const updates = userCards.map(async (userCard) => {
        const { monedas, rareza } = await getMonedasYRarezaCard(
          userCard.mal_id
        );
        userCard.content.monedas = monedas;
        userCard.content.rareza = rareza;
        await userCard.save();
        return userCard;
      });

      const updatedCards = await Promise.all(updates);

      // Devuelve las cartas completas del usuario con el campo 'monedas' actualizado
      res.status(200).json(updatedCards);
    } catch (error) {
      console.error("Error en findUserCardsById:", error);
      res
        .status(500)
        .json({ error: "Error interno del servidor al buscar las cartas." });
    }
  },
  async deleteCards(req, res) {
    try {
      const { email } = req.body;

      // Verifica si el email se proporciona
      if (!email) {
        return res.status(400).json({
          error: "Se requiere proporcionar un email para eliminar las cartas.",
        });
      }

      // Busca al usuario por su email en la base de datos
      const user = await User.findOne({ email });

      // Verifica si se encontró un usuario con el email proporcionado
      if (!user) {
        return res.status(404).json({
          error: "No se encontró un usuario con el email proporcionado.",
        });
      }

      // Elimina las cartas asociadas al usuario
      await Card.deleteMany({ _id: { $in: user.cards } });

      // Elimina todas las referencias a las cartas en el array 'cards' del usuario
      user.cards = [];
      await user.save();

      res.status(200).json({
        message: "Se han eliminado las cartas del usuario correctamente.",
      });
    } catch (error) {
      console.error("Error en deleteCardsByUserEmail:", error);
      res
        .status(500)
        .json({ error: "Error interno del servidor al eliminar las cartas." });
    }
  },

  async ViewUserCards(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(404).json({
          error:
            "Se requiere proporcionar un ID de usuario para buscar las cartas.",
        });
      }

      // Busca al usuario por su ID en la base de datos
      const user = await User.findOne({ _id: id });

      // Verifica si se encontró un usuario con el ID proporcionado
      if (!user) {
        return res.status(404).json({
          error: "No se encontró un usuario con el ID proporcionado.",
        });
      }

      // Busca todas las cartas asociadas al usuario
      const userCards = await Card.find({ _id: { $in: user.cards } });

      if (!userCards || userCards.length === 0) {
        return res.status(202).json({
          error:
            "No se encontraron cartas para el usuario con el ID proporcionado.",
        });
      }

      // Para cada carta, obtén las monedas y actualiza el campo 'monedas'
      for (const userCard of userCards) {
        const mal_id = userCard.mal_id;
        const monedas = await getMonedasCard(mal_id);
        const rareza = await getRarezaCard(userCard.mal_id);

        userCard.content.monedas = monedas;
        userCard.content.rareza = rareza;
      }

      // Devuelve las cartas completas del usuario con el campo 'monedas' actualizado
      res.status(200).json(userCards);
    } catch (error) {
      console.error("Error en ViewUserCards:", error);
      res.status(500).json({
        error: "Error interno del servidor al buscar las cartas del usuario.",
      });
    }
  },

  async findCharacterById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: "Se requiere proporcionar un ID para buscar el personaje.",
        });
      }

      // Realiza la búsqueda del personaje en base al ID proporcionado
      const character = await Anilist.people.character(parseInt(id));

      if (!character || !character.id) {
        return res
          .status(404)
          .json({ error: `No se encontró un personaje con el ID ${id}.` });
      }

      res.status(200).json(character);
    } catch (error) {
      console.error("Error en findCharacterById:", error);
      res
        .status(500)
        .json({ error: "Error interno del servidor al buscar el personaje." });
    }
  },
  async existCard(req, res) {
    try {
      const { email, content } = req.body;

      // Verifica si el email y el contenido de la carta se proporcionan
      if (!email || !content) {
        return res.status(400).json({
          error:
            "Se requiere proporcionar un email y contenido para comprobar la existencia de la carta.",
        });
      }

      // Busca al usuario por su email en la base de datos
      const user = await User.findOne({ email });

      // Verifica si se encontró un usuario con el email proporcionado
      if (!user) {
        return res.status(404).json({
          error: "No se encontró un usuario con el email proporcionado.",
        });
      }

      const existingCard = await Card.findOne({
        "content.mal_id": content.mal_id,
        "user.id": user._id,
      });

      if (existingCard) {
        // La carta existe, devuelve true
        return res.status(202).json({ exists: true });
      } else {
        // La carta no existe, devuelve false
        return res.status(200).json({ exists: false });
      }
    } catch (error) {
      console.error("Error en existCard:", error);
      res.status(500).json({
        error:
          "Error interno del servidor al comprobar la existencia de la carta.",
      });
    }
  },

  async deleteIndividualCard(req, res) {
    try {
      const { email, mal_id } = req.params;

      if (!email || !mal_id) {
        return res.status(400).json({
          error: "An email and mal_id are required to delete the card.",
        });
      }

      // Busca la carta donde mal_id coincida y el email sea el del usuario
      const card = await Card.findOne({ mal_id, "user.email": email });

      // Busca al usuario por su email en la base de datos
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          error: "No user found with the provided email.",
        });
      }

      if (!card) {
        return res.status(404).json({
          error: "No card found with the provided mal_id and associated email.",
        });
      }

      await Card.deleteOne({ mal_id, "user.email": email });

      // Elimina la referencia de la carta en el array 'cards' del usuario
      user.cards = user.cards.filter(
        (c) => c.toString() !== card._id.toString()
      );
      await user.save();

      res.status(200).json({
        message: "Card deleted successfully.",
      });
    } catch (error) {
      console.error("Error in deleteIndividualCard:", error);
      res.status(500).json({
        error: "Internal server error while deleting the card.",
      });
    }
  },
};

module.exports = cardController;
