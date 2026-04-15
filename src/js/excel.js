const excelHelper = {
  readStopItems(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const items = jsonData.map(row => ({
            ProjectCode: row['项目编码'] || row['ProjectCode'] || '',
            ProjectName: row['项目名称'] || row['ProjectName'] || '',
            StopReason: row['停用原因'] || row['StopReason'] || ''
          })).filter(item => item.ProjectCode);

          resolve(items);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  readAddItems(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const items = jsonData.map(row => ({
            ProjectCode: row['项目编码'] || row['ProjectCode'] || '',
            ProjectName: row['项目名称'] || row['ProjectName'] || '',
            ExecuteDept: row['执行科室'] || row['ExecuteDept'] || '',
            OutpatientAttr: row['门诊归属'] || row['门诊属性'] || row['OutpatientAttr'] || '',
            InpatientAttr: row['住院归属'] || row['住院属性'] || row['InpatientAttr'] || '',
            ProvincePrice: parseFloat(row['省标价'] || row['ProvincePrice']) || 0,
            CityPrice: parseFloat(row['市标价'] || row['CityPrice']) || 0,
            CountyPrice: parseFloat(row['县标价'] || row['CountyPrice']) || 0,
            Price: parseFloat(row['价格'] || row['Price']) || 0,
            PricingUnit: row['计价单位'] || row['PricingUnit'] || '',
            Spec: row['规格'] || row['Spec'] || '',
            Model: row['型号'] || row['Model'] || ''
          })).filter(item => item.ProjectCode);

          resolve(items);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  downloadStopTemplate() {
    const data = [{
      '项目编码': '',
      '项目名称': '',
      '停用原因': ''
    }];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '停用项目');
    XLSX.writeFile(workbook, '停用项目模板.xlsx');
  },

  downloadAddTemplate() {
    const data = [{
      '项目编码': '',
      '项目名称': '',
      '执行科室': '',
      '门诊归属': '',
      '住院归属': '',
      '省标价': '',
      '市标价': '',
      '县标价': '',
      '价格': '',
      '计价单位': '',
      '规格': '',
      '型号': ''
    }];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '新增项目');
    XLSX.writeFile(workbook, '新增项目模板.xlsx');
  }
};