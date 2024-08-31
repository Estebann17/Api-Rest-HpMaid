const User = require("../models/user");
const View = require("../models/view");

const viewController = {
  async createView(req, res) {
    try {
      const { viewerEmail, targetUserId } = req.params;

      // Buscar al usuario que realiza la view por su correo electrónico
      const viewer = await User.findOne({ email: viewerEmail });

      if (!viewer) {
        return res
          .status(404)
          .json({ message: "Usuario que realiza la view no encontrado" });
      }

      // Verificar si el usuario al que se ve existe
      const targetUser = await User.findById(targetUserId);

      if (!targetUser) {
        return res
          .status(404)
          .json({ message: "Usuario objetivo no encontrado" });
      }

      // Verificar si ya existe una view entre el usuario que realiza la view y el usuario objetivo
      const existingView = await View.findOne({
        viewer: viewer._id,
        targetUser: targetUser._id,
      });

      if (existingView) {
        // Si ya existe una view, devuelve el usuario con el número total de views
        const totalViews = await View.countDocuments({
          targetUser: targetUser._id,
        });
        return res.status(201).json({ totalViews });
      }

      // Crear la nueva view
      const newView = new View({
        viewer: viewer._id,
        targetUser: targetUser._id,
      });

      // Guardar la view en la base de datos
      await newView.save();

      // Agregar la view al usuario que la realiza
      targetUser.views.push(newView);
      await targetUser.save();

      // Devolver el usuario con el número total de views
      const totalViews = await View.countDocuments({
        targetUser: targetUser._id,
      });
      res.status(201).json({ totalViews });
    } catch (error) {
      console.error("Error creando la view:", error);
      res
        .status(500)
        .json({ message: "Error creando la view", error: error.message });
    }
  },

  async getView(req, res) {
    try {
      const { userEmail } = req.params;

      const user = await User.findOne({ email: userEmail });

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const totalViews = await View.countDocuments({
        targetUser: user._id,
      });

      res.status(201).json({ totalViews });
    } catch (error) {
      console.error("Error obteniendo las vistas:", error);
      res
        .status(500)
        .json({ message: "Error obteniendo las vistas", error: error.message });
    }
  },
};

module.exports = viewController;
