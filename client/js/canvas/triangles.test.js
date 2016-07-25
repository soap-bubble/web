import triangles, { tessellation } from './triangles';
import chai, { expect } from 'chai';

chai.use(function (_chai, utils) {
  function assertTriangleCount(count) {
    //expect(this._obj, 'triangle tessellation object').to.have.keys('vertexCoords', 'vertexIndex');
    expect(this._obj.vertexIndex, 'vertexIndex').to.have.length(count * 3)
  }

  function chainTriangleCount() {
    utils.flag(this, 'tessellation.count', true);
  }

  _chai.Assertion.addChainableMethod('tessellationCount', assertTriangleCount, chainTriangleCount);
});

describe('triangles', function () {
  describe('tessellation', function () {
    it('exists', function () {
      expect(tessellation).to.be.ok;
    });

    it('2 triangles', function () {
      const t = tessellation([10, 10], [1, 1], [0, 0]);
      console.log(JSON.stringify(t));
      expect(t).to.have.tessellationCount(2);
      expect(t).deep.equal({"vertexCoords":[-5,-5,5,-5,-5,5,5,5],"vertexCoordSize":2,"vertexCoordLength":4,"vertexIndex":[0,2,1,2,3,1],"vertexIndexSize":1,"vertexIndexLength":6});
    });


    it('2 triangles with top-left anchor', function () {
      const t = tessellation([10, 10], [1, 1], [-5, -5]);
      console.log(JSON.stringify(t));
      expect(t).to.have.tessellationCount(2);
      expect(t).deep.equal({"vertexCoords":[0,0,10,0,0,10,10,10],"vertexCoordSize":2,"vertexCoordLength":4,"vertexIndex":[0,2,1,2,3,1],"vertexIndexSize":1,"vertexIndexLength":6});
    });

    it('4 triangles', function () {
      const t = tessellation([10, 10], [2, 2], [-5, -5]);
      console.log(JSON.stringify(t));
      expect(t).to.have.tessellationCount(8);
      expect(t).deep.equal({"vertexCoords":[0,0,5,0,10,0,0,5,5,5,10,5,0,10,5,10,10,10],"vertexCoordSize":2,"vertexCoordLength":9,"vertexIndex":[0,2,1,2,3,1,1,3,2,3,4,2,4,6,5,6,7,5,5,7,6,7,8,6],"vertexIndexSize":1,"vertexIndexLength":24});
    });
  });
});