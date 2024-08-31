// En followController.js

const Follow = require("../models/follow"); // Asegúrate de tener el modelo Follow importado
const User = require("../models/user");

const followController = {
  async getFollowData(req, res) {
    try {
      // Obtener el correo electrónico del cuerpo de la solicitud
      const { email } = req.body;

      // Verificar si se proporcionó un correo electrónico en el cuerpo de la solicitud
      if (!email) {
        return res
          .status(202)
          .json({
            message:
              "El correo electrónico es obligatorio en el cuerpo de la solicitud",
          });
      }

      // Buscar al usuario en la base de datos por correo electrónico
      const user = await User.findOne({ email })
        .populate("followers") // Populate para obtener detalles de los seguidores
        .populate("following"); // Populate para obtener detalles de los usuarios seguidos

      if (!user) {
        return res
          .status(202)
          .json({
            message: "Usuario no encontrado con este correo electrónico",
          });
      }

      // Obtener la cantidad de seguidores y seguidos
      const followersCount = user.followers.length;
      const followingCount = user.following.length;

      res
        .status(200)
        .json({
          message: "Datos de seguimiento obtenidos exitosamente",
          followersCount,
          followingCount,
        });
    } catch (error) {
      console.error("Error obteniendo datos de seguimiento:", error);
      res
        .status(500)
        .json({
          message: "Error obteniendo datos de seguimiento",
          error: error.message,
        });
    }
  },

  async getFollowDataById(req, res) {
    try {
      // Obtener el ID del usuario de la solicitud
      const { userId } = req.body;

      // Verificar si se proporcionó un ID en el cuerpo de la solicitud
      if (!userId) {
        return res.status(400).json({
          message: "El ID del usuario es obligatorio en el cuerpo de la solicitud",
        });
      }

      // Buscar al usuario en la base de datos por su ID
      const user = await User.findById(userId)
        .populate("followers") // Populate para obtener detalles de los seguidores
        .populate("following"); // Populate para obtener detalles de los usuarios seguidos

      if (!user) {
        return res.status(404).json({
          message: "Usuario no encontrado con este ID",
        });
      }

      // Obtener la cantidad de seguidores y seguidos
      const followersCount = user.followers.length;
      const followingCount = user.following.length;

      res.status(200).json({
        message: "Datos de seguimiento obtenidos exitosamente",
        followersCount,
        followingCount,
      });
    } catch (error) {
      console.error("Error obteniendo datos de seguimiento por ID:", error);
      res.status(500).json({
        message: "Error obteniendo datos de seguimiento por ID",
        error: error.message,
      });
    }
  },
  

  async saveFollow(req, res) {
    try {
      // Obtener los correos electrónicos del cuerpo de la solicitud
      const { userEmail, targetId } = req.body;

      // Verificar si se proporcionaron los correos electrónicos en el cuerpo de la solicitud
      if (!userEmail || !targetId) {
        return res
          .status(400)
          .json({
            message:
              "Los correos electrónicos son obligatorios en el cuerpo de la solicitud",
          });
      }

      // Buscar al usuario que sigue en la base de datos por su correo electrónico
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "Usuario que sigue no encontrado con este correo electrónico",
          });
      }

      // Buscar al usuario a seguir en la base de datos por su ID
      const targetUser = await User.findById(targetId);
      if (!targetUser) {
        return res
          .status(404)
          .json({ message: "Usuario a seguir no encontrado con este ID" });
      }

      // Verificar si ya existe una relación de seguimiento
      const existingFollow = await Follow.findOne({
        "follower.userId": user._id,
        "following.userId": targetUser._id,
      });

      if (existingFollow) {
        return res.status(400).json({ message: "Ya sigues a este usuario" });
      }

      // Crear un nuevo objeto Follow y guardarlo en la base de datos
      const newFollow = new Follow({
        follower: { userId: user._id, email: userEmail },
        following: { userId: targetUser._id, email: targetUser.email },
      });

      await newFollow.save();

      // Actualizar el usuario que sigue
      user.following.push(targetUser._id);
      await user.save();

      // Actualizar el usuario seguido
      targetUser.followers.push(user._id);
      await targetUser.save();

      res
        .status(200)
        .json({ message: "Usuario seguido exitosamente", follow: newFollow });
    } catch (error) {
      console.error("Error siguiendo al usuario:", error);
      res
        .status(500)
        .json({ message: "Error siguiendo al usuario", error: error.message });
    }
  },

  async deleteFollow(req, res) {
    try {
      // Obtener los correos electrónicos del cuerpo de la solicitud
      const { userEmail, targetId } = req.body;

      // Verificar si se proporcionaron los correos electrónicos en el cuerpo de la solicitud
      if (!userEmail || !targetId) {
        return res.status(400).json({ message: "Faltan datos por enviar" });
      }

      // Buscar al usuario que sigue en la base de datos por su correo electrónico
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "Usuario que sigue no encontrado con este correo electrónico",
          });
      }

      // Buscar al usuario a dejar de seguir en la base de datos por su ID
      const targetUser = await User.findById(targetId);
      if (!targetUser) {
        return res
          .status(404)
          .json({
            message: "Usuario a dejar de seguir no encontrado con este ID",
          });
      }

      // Buscar y eliminar la relación de seguimiento si existe
      const followToDelete = await Follow.findOneAndDelete({
        "follower.userId": user._id,
        "following.userId": targetUser._id,
      });

      if (!followToDelete) {
        return res
          .status(404)
          .json({
            message:
              "No existe una relación de seguimiento entre estos usuarios",
          });
      }

      // Actualizar el usuario que sigue (eliminar el ID del usuario seguido de la lista de following)
      user.following = user.following.filter(
        (id) => id.toString() !== targetUser._id.toString()
      );
      await user.save();

      // Actualizar el usuario seguido (eliminar el ID del usuario que sigue de la lista de followers)
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== user._id.toString()
      );
      await targetUser.save();

      res
        .status(200)
        .json({
          message: "Relación de seguimiento eliminada exitosamente",
          follow: followToDelete,
        });
    } catch (error) {
      console.error("Error eliminando la relación de seguimiento:", error);
      res
        .status(500)
        .json({
          message: "Error eliminando la relación de seguimiento",
          error: error.message,
        });
    }
  },

  async isFollowing(req, res) {
    try {
      
      const { userEmail, targetId } = req.body;

      // Verificar si se proporcionaron los correos electrónicos en el cuerpo de la solicitud
      if (!userEmail || !targetId) {
        return res
          .status(202)
          .json({
            message:
              "Los correos electrónicos son obligatorios en el cuerpo de la solicitud",
          });
      }

      // Buscar al usuario que sigue en la base de datos por su correo electrónico
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res
          .status(202)
          .json({
            message:
              "Usuario que sigue no encontrado con este correo electrónico",
          });
      }

      // Verificar si el usuario sigue al objetivo
      const isFollowing = user.following.some(
        (id) => id.toString() === targetId.toString()
      );

      res.status(200).json({ isFollowing });
    } catch (error) {
      console.error("Error verificando si el usuario sigue:", error);
      res
        .status(500)
        .json({
          message: "Error verificando si el usuario sigue",
          error: error.message,
        });
    }
  },


  async Itsme(req, res) {
    try {
      // Obtener el targetId y el UserEmail del cuerpo de la solicitud
      const { targetId, userEmail } = req.body;

      // Verificar si se proporcionó un targetId y un UserEmail en el cuerpo de la solicitud
      if (!targetId || !userEmail) {
        return res
          .status(200)
          .json({
            message:
              "El targetId y el UserEmail son obligatorios en el cuerpo de la solicitud",
          });
      }

      // Buscar al usuario en la base de datos por targetId y UserEmail
      const user = await User.findOne({ _id: targetId, email: userEmail });

      // Responder true si el usuario existe, false de lo contrario
      const result = !!user;

      res.status(200).json({ result });
    } catch (error) {
      console.error("Error verificando el usuario:", error);
      res
        .status(500)
        .json({
          message: "Error verificando el usuario",
          error: error.message,
        });
    }
  },
};

module.exports = followController;
