pragma solidity >=0.6.5 <0.7;

library Bytes32Set {

	struct Set {
		mapping(bytes32 => uint) keyPointers;
		bytes32[] keyList;
	}

	function insert(Set storage self, bytes32 _data) internal returns(bool) {
		uint pointer = self.keyPointers[_data];

		if(pointer != 0) return false;

		self.keyList.push(_data);
		pointer = size(self);
		self.keyPointers[_data] = pointer;
		return true;
	}

	function remove(Set storage self, bytes32 _data) internal {
		uint pointerToRemove = self.keyPointers[_data];
		require(pointerToRemove != 0, "key not found");
		uint lastPointer = size(self);

		if(pointerToRemove != lastPointer) {
			bytes32 lastValue = self.keyList[lastPointer - 1];
			self.keyList[pointerToRemove - 1] = lastValue;
			self.keyPointers[lastValue] = pointerToRemove;

		}
		self.keyList.pop();
		self.keyPointers[_data] = 0;
	}

	function size(Set storage self) internal view returns(uint) {
		return self.keyList.length;
	}

	function exists(Set storage self, bytes32 _data) internal view returns(bool) {
		uint pointer = self.keyPointers[_data];
		return pointer != 0;
	}

	function get(Set storage self, uint _index) internal view returns(bytes32) {
		return self.keyList[_index];
	}

}
