const structureService = require('./structure.service');
const userService = require('../../../user/user.service');
const StructureAnalyzer = require('./structure.analysis');
const Structure = require('./structure.model');


/**
 * Create a structure under project id
 * @param req
 * @param res
 * @param next
 */
function createStructure(req, res, next) {
  const structure = req.body['structure'];
  const project_id = req.body['project_id'];
  const userId = req.userId;
  structureService.createStructure(structure, project_id, userId).
      then((data) => {
        return res.status(201).send(
            {
              message: 'Structure successfully created',
              data: {structure: data},
            });
      }).
      catch(next);
}


/**
 * Get a single structure
 * @param req
 * @param res
 * @param next
 */
function getStructure(req, res, next) {
  if (Number(req.params.id) >= 0) {
    structureService.getStructure(
        Number(req.params.id),
        req.userId,
        req.userRole,
    ).then(structure => {
      return res.status(200).send({data: structure});
    }).catch(next);
  } else {
    return res.status(400).send({message: 'Structure ID must be a number'});
  }
}


/**
 * Get solved data
 * @param req
 * @param res
 * @param next
 */
function getSolvedData(req, res, next) {
  if (Number(req.params.id) >= 0) {
    structureService.getAnalyseResult(
        Number(req.params.id),
        req.userId,
    ).then(analysisRes => {
      return res.status(200).send({data: analysisRes});
    }).catch(next);
  } else {
    return res.status(400).send({message: 'Structure ID must be a number'});
  }
}


/**
 * Edit a single structure
 * @param req
 * @param res
 * @param next
 */
function editStructure(req, res, next) {
  const name = req.body.name,
      location = req.body.location,
      revision = req.body.revision,
      structureId = req.params.id,
      userId = req.userId,
      userRole = req.userRole;
  structureService.basicStructureEdit(name, location, revision, structureId,
      userId, userRole).then(() => {
    return res.status(200).send({message: 'Structure successfully updated'});
  }).catch(next);
}


/**
 * Update skyciv model of structure
 * @param req
 * @param res
 * @param next
 */
function updateSkycivModel(req, res, next) { // TODO: change alf from 0, It's just for test
  let structureData = new Structure(req.body.structure_data, req.query.alf);
  structureData.convertToSkycivModel().then(skycivModel => {
    structureService.advanceStructureEdit([
          'structure_data',
          'skyciv_model',
          'structure_guide',
          'structure_drafts',
        ],
        [
          req.body.structure_data,
          skycivModel,
          structureData.guides,
          structureData.drafts,
        ],
        req.params.id, req.userId,
        req.userRole,
    ).then(() => {
      res.status(200).send({
        message: 'Your data successfully converted to skyciv Model',
        data: {skycivModel, structure: req.body},
      });
    }).catch(next);
  }).catch(next);

}


/**
 * Solve a structure
 * @param req
 * @param res
 * @param next
 */
function analyzeStructure(req, res, next) {
  const structureId = req.params.id,
      userId = req.userId,
      userRole = req.userRole;
  structureService.getSkycivModel(structureId, userId).then(data => {
    let structureAnalyzer = new StructureAnalyzer(
        structureId,
        data['skycivModel'],
        data['structureType'],
        data['guides'],
        data['drafts'],
    );
    structureAnalyzer.analyze(data).then(solvedData => {
      userService.apiUsageIncrement(userId).then(() => {
        structureService.advanceStructureEdit(
            ['analyzed_data'],
            [solvedData],
            structureId,
            userId,
            userRole,
        ).then(() => {
          res.status(200).send({data: solvedData});
        }).catch(next);
      }).catch(next);
    }).catch(next);
  }).catch(next);
}


/**
 * Update structure revision number
 * @param req
 * @param res
 * @param next
 */
function updateStructureRevision(req, res, next) {
  structureService.advanceStructureEdit(['revision'], [req.body.revision],
      req.params.id,
      req.userId,
      req.userRole,
  ).then(() => {
    res.status(200).send({
                           message: 'Your revision is updated successfully',
                         });
  }).catch(next);
}


function updateStructureThumbnail(req, res, next) {
  structureService.advanceStructureEdit(['preview_url'], [req.body.preview_url],
      req.params.id,
      req.userId,
      req.userRole,
  ).then(() => {
    res.status(200).send({
                           message: 'Your preview image is updated successfully',
                         });
  }).catch(next);
}


module.exports = {
  updateSkycivModel,
  createStructure,
  getStructure,
  getSolvedData,
  editStructure,
  analyzeStructure,
  updateStructureRevision,
  updateStructureThumbnail,
};
