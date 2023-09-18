const projectService = require("./project.service");

/**
 * New sa project for a user
 */
function createProject(req, res, next) {
  const project = {
    name: req.body.name,
    owner: req.userId,
  };
  projectService
    .createProject(project)
    .then((data) => {
      return res.status(201).send({
        message: "Project successfully created",
        data: {
          project_id: data._id,
        },
      });
    })
    .catch(next);
}

/**
 * Get all sa projects of a user
 */
function getAllProject(req, res, next) {
  projectService
    .getAllProjects(req.userId, req.userRole)
    .then((data) => {
      return res.status(200).send({ data });
    })
    .catch(next);
}

/**
 * Edit a single project by id
 */
function editProject(req, res, next) {
  let editedProject = {
    name: req.body.name,
    slug: req.body.name.toLowerCase().replaceAll(" ", "-"),
  };

  projectService
    .editProject(req.params.id, req.userId, req.userRole, editedProject)
    .then((editedTool) => {
      return res.status(200).send({ message: "Project successfully updated" });
    })
    .catch(next);
}

module.exports = {
  createProject,
  getAllProject,
  editProject,
};
